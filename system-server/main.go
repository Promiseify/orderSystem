package main

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"os"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

const (
	RoleAdmin   = "admin"
	RoleManager = "manager"
	RoleClerk   = "clerk"

	StatusEnabled  = "enabled"
	StatusDisabled = "disabled"
)

var orderStatusFlow = map[string][]string{
	"pending":   {"accepted", "rejected", "cancelled"},
	"accepted":  {"cooking", "cancelled"},
	"cooking":   {"ready", "cancelled"},
	"ready":     {"served", "completed", "cancelled"},
	"served":    {"completed"},
	"completed": {},
	"cancelled": {},
	"rejected":  {},
}

type AdminAccount struct {
	ID          string `json:"id"`
	Username    string `json:"username"`
	Password    string `json:"password,omitempty"`
	Name        string `json:"name"`
	Role        string `json:"role"`
	Status      string `json:"status"`
	CreatedAt   string `json:"createdAt"`
	LastLoginAt string `json:"lastLoginAt,omitempty"`
}

type AppUser struct {
	ID         string  `json:"id"`
	Nickname   string  `json:"nickname"`
	Phone      string  `json:"phone"`
	Avatar     string  `json:"avatar"`
	Status     string  `json:"status"`
	OrderCount int     `json:"orderCount"`
	TotalSpent float64 `json:"totalSpent"`
	CreatedAt  string  `json:"createdAt"`
}

type Category struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Sort      int    `json:"sort"`
	Status    string `json:"status"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

type Dish struct {
	ID          string  `json:"id"`
	CategoryID  string  `json:"categoryId"`
	Name        string  `json:"name"`
	Price       float64 `json:"price"`
	Stock       int     `json:"stock"`
	Sales       int     `json:"sales"`
	Status      string  `json:"status"`
	Image       string  `json:"image"`
	Description string  `json:"description"`
	UpdatedAt   string  `json:"updatedAt"`
}

type OrderItem struct {
	DishID        string  `json:"dishId"`
	NameSnapshot  string  `json:"nameSnapshot"`
	PriceSnapshot float64 `json:"priceSnapshot"`
	Quantity      int     `json:"quantity"`
	ServedQty     int     `json:"servedQuantity"`
}

type OrderLog struct {
	ID           string `json:"id"`
	Action       string `json:"action"`
	OperatorID   string `json:"operatorId"`
	OperatorName string `json:"operatorName"`
	Source       string `json:"source"`
	Time         string `json:"time"`
	Remark       string `json:"remark"`
}

type Order struct {
	ID           string      `json:"id"`
	UserID       string      `json:"userId"`
	UserName     string      `json:"userName"`
	Type         string      `json:"type"`
	TableNo      string      `json:"tableNo,omitempty"`
	ContactPhone string      `json:"contactPhone,omitempty"`
	Remark       string      `json:"remark,omitempty"`
	Status       string      `json:"status"`
	Items        []OrderItem `json:"items"`
	TotalAmount  float64     `json:"totalAmount"`
	CreatedAt    string      `json:"createdAt"`
	UpdatedAt    string      `json:"updatedAt"`
	Logs         []OrderLog  `json:"logs"`
}

type StoreSetting struct {
	StoreName      string   `json:"storeName"`
	BusinessHours  string   `json:"businessHours"`
	Phone          string   `json:"phone"`
	Notice         string   `json:"notice"`
	MinDeliveryFee float64  `json:"minDeliveryFee"`
	DeliveryFee    float64  `json:"deliveryFee"`
	BannerImages   []string `json:"bannerImages"`
}

type OperationLog struct {
	ID           string `json:"id"`
	Module       string `json:"module"`
	Action       string `json:"action"`
	OperatorID   string `json:"operatorId"`
	OperatorName string `json:"operatorName"`
	Detail       string `json:"detail"`
	Time         string `json:"time"`
}

type SessionUser struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Username string `json:"username"`
	Role     string `json:"role"`
}

type Store struct {
	mu sync.RWMutex

	admins        []AdminAccount
	appUsers      []AppUser
	categories    []Category
	dishes        []Dish
	orders        []Order
	storeSetting  StoreSetting
	operationLogs []OperationLog
	tokens        map[string]SessionUser
}

func main() {
	store := seedStore()

	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: false,
		MaxAge:           12 * time.Hour,
	}))

	api := r.Group("/api")
	admin := api.Group("/admin")

	admin.POST("/auth/login", store.login)

	withAuth := admin.Group("")
	withAuth.Use(store.authRequired())
	{
		withAuth.GET("/auth/profile", store.profile)
		withAuth.POST("/auth/logout", store.logout)

		withAuth.GET("/categories", store.listCategories)
		withAuth.POST("/categories", store.roleRequired(RoleAdmin, RoleManager), store.createCategory)
		withAuth.PUT("/categories/:id", store.roleRequired(RoleAdmin, RoleManager), store.updateCategory)
		withAuth.DELETE("/categories/:id", store.roleRequired(RoleAdmin, RoleManager), store.deleteCategory)
		withAuth.PATCH("/categories/:id/status", store.roleRequired(RoleAdmin, RoleManager), store.toggleCategoryStatus)

		withAuth.GET("/dishes", store.listDishes)
		withAuth.POST("/dishes", store.roleRequired(RoleAdmin, RoleManager), store.createDish)
		withAuth.PUT("/dishes/:id", store.roleRequired(RoleAdmin, RoleManager), store.updateDish)
		withAuth.DELETE("/dishes/:id", store.roleRequired(RoleAdmin, RoleManager), store.deleteDish)
		withAuth.PATCH("/dishes/:id/status", store.roleRequired(RoleAdmin, RoleManager), store.toggleDishStatus)

		withAuth.GET("/orders", store.listOrders)
		withAuth.PATCH("/orders/:id/status", store.roleRequired(RoleAdmin, RoleManager, RoleClerk), store.updateOrderStatus)

		withAuth.GET("/app-users", store.roleRequired(RoleAdmin), store.listAppUsers)
		withAuth.PATCH("/app-users/:id/status", store.roleRequired(RoleAdmin), store.toggleAppUserStatus)

		withAuth.GET("/admin-users", store.roleRequired(RoleAdmin), store.listAdminUsers)
		withAuth.POST("/admin-users", store.roleRequired(RoleAdmin), store.createAdminUser)
		withAuth.PUT("/admin-users/:id", store.roleRequired(RoleAdmin), store.updateAdminUser)

		withAuth.GET("/store-setting", store.roleRequired(RoleAdmin, RoleManager), store.getStoreSetting)
		withAuth.PUT("/store-setting", store.roleRequired(RoleAdmin, RoleManager), store.updateStoreSetting)

		withAuth.GET("/operation-logs", store.roleRequired(RoleAdmin, RoleManager), store.listOperationLogs)
	}

	port := os.Getenv("PORT")
	if strings.TrimSpace(port) == "" {
		port = "8080"
	}

	addr := ":" + port
	log.Printf("system-server listening on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatal(err)
	}
}

func nowText() string {
	return time.Now().Format("2006-01-02 15:04:05")
}

func newID(prefix string) string {
	buf := make([]byte, 5)
	_, _ = rand.Read(buf)
	return fmt.Sprintf("%s-%d-%s", prefix, time.Now().UnixMilli(), hex.EncodeToString(buf))
}

func newToken() string {
	buf := make([]byte, 24)
	_, _ = rand.Read(buf)
	return hex.EncodeToString(buf)
}

func containsAny(items []string, val string) bool {
	for _, it := range items {
		if it == val {
			return true
		}
	}
	return false
}

func cloneOrders(input []Order) []Order {
	out := make([]Order, len(input))
	for i, o := range input {
		itemCopy := append([]OrderItem(nil), o.Items...)
		logCopy := append([]OrderLog(nil), o.Logs...)
		o.Items = itemCopy
		o.Logs = logCopy
		out[i] = o
	}
	return out
}

func ok(c *gin.Context, data any) {
	c.JSON(http.StatusOK, gin.H{"code": 0, "msg": "ok", "data": data})
}

func fail(c *gin.Context, status int, msg string) {
	c.JSON(status, gin.H{"code": status, "msg": msg})
}

func (s *Store) appendOperation(module, action, detail string, user SessionUser) {
	logItem := OperationLog{
		ID:           newID("op"),
		Module:       module,
		Action:       action,
		OperatorID:   user.ID,
		OperatorName: user.Name,
		Detail:       detail,
		Time:         nowText(),
	}
	s.operationLogs = append([]OperationLog{logItem}, s.operationLogs...)
	if len(s.operationLogs) > 500 {
		s.operationLogs = s.operationLogs[:500]
	}
}

func (s *Store) getUserFromContext(c *gin.Context) SessionUser {
	v, ok := c.Get("sessionUser")
	if !ok {
		return SessionUser{ID: "system", Name: "系统", Role: RoleAdmin, Username: "system"}
	}
	user, ok := v.(SessionUser)
	if !ok {
		return SessionUser{ID: "system", Name: "系统", Role: RoleAdmin, Username: "system"}
	}
	return user
}

func (s *Store) authRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		parts := strings.SplitN(auth, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") || strings.TrimSpace(parts[1]) == "" {
			fail(c, http.StatusUnauthorized, "未提供有效登录凭证")
			c.Abort()
			return
		}

		token := strings.TrimSpace(parts[1])
		s.mu.RLock()
		user, exists := s.tokens[token]
		s.mu.RUnlock()
		if !exists {
			fail(c, http.StatusUnauthorized, "登录已失效，请重新登录")
			c.Abort()
			return
		}

		c.Set("sessionUser", user)
		c.Set("sessionToken", token)
		c.Next()
	}
}

func (s *Store) roleRequired(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := s.getUserFromContext(c)
		if !containsAny(roles, user.Role) {
			fail(c, http.StatusForbidden, "无权限执行该操作")
			c.Abort()
			return
		}
		c.Next()
	}
}

func (s *Store) login(c *gin.Context) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, "请求参数错误")
		return
	}

	req.Username = strings.TrimSpace(req.Username)
	if req.Username == "" || strings.TrimSpace(req.Password) == "" {
		fail(c, http.StatusBadRequest, "账号或密码不能为空")
		return
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	var found *AdminAccount
	for i := range s.admins {
		if s.admins[i].Username == req.Username {
			found = &s.admins[i]
			break
		}
	}
	if found == nil {
		fail(c, http.StatusUnauthorized, "账号不存在")
		return
	}
	if found.Status != StatusEnabled {
		fail(c, http.StatusUnauthorized, "账号已停用")
		return
	}
	if found.Password != req.Password {
		fail(c, http.StatusUnauthorized, "密码错误")
		return
	}

	found.LastLoginAt = nowText()
	user := SessionUser{ID: found.ID, Name: found.Name, Username: found.Username, Role: found.Role}
	token := newToken()
	s.tokens[token] = user

	ok(c, gin.H{
		"token": token,
		"user":  user,
	})
}

func (s *Store) profile(c *gin.Context) {
	ok(c, s.getUserFromContext(c))
}

func (s *Store) logout(c *gin.Context) {
	tokenVal, _ := c.Get("sessionToken")
	token, _ := tokenVal.(string)

	s.mu.Lock()
	if token != "" {
		delete(s.tokens, token)
	}
	s.mu.Unlock()

	ok(c, gin.H{})
}

func (s *Store) listCategories(c *gin.Context) {
	s.mu.RLock()
	list := append([]Category(nil), s.categories...)
	s.mu.RUnlock()

	sort.Slice(list, func(i, j int) bool { return list[i].Sort < list[j].Sort })
	ok(c, list)
}

func (s *Store) createCategory(c *gin.Context) {
	var req struct {
		Name   string `json:"name"`
		Sort   int    `json:"sort"`
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, "请求参数错误")
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		fail(c, http.StatusBadRequest, "分类名称不能为空")
		return
	}
	if req.Status == "" {
		req.Status = StatusEnabled
	}
	if !containsAny([]string{StatusEnabled, StatusDisabled}, req.Status) {
		fail(c, http.StatusBadRequest, "状态非法")
		return
	}

	user := s.getUserFromContext(c)
	s.mu.Lock()
	defer s.mu.Unlock()

	for _, item := range s.categories {
		if strings.EqualFold(item.Name, req.Name) {
			fail(c, http.StatusBadRequest, "分类名称已存在")
			return
		}
	}

	now := nowText()
	if req.Sort <= 0 {
		req.Sort = len(s.categories) + 1
	}
	category := Category{
		ID:        newID("cat"),
		Name:      req.Name,
		Sort:      req.Sort,
		Status:    req.Status,
		CreatedAt: now,
		UpdatedAt: now,
	}
	s.categories = append(s.categories, category)
	s.appendOperation("分类管理", "新增分类", "新增分类："+req.Name, user)
	ok(c, gin.H{})
}

func (s *Store) updateCategory(c *gin.Context) {
	id := c.Param("id")
	var req Category
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, "请求参数错误")
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		fail(c, http.StatusBadRequest, "分类名称不能为空")
		return
	}

	user := s.getUserFromContext(c)
	s.mu.Lock()
	defer s.mu.Unlock()

	idx := -1
	for i := range s.categories {
		if s.categories[i].ID == id {
			idx = i
			break
		}
	}
	if idx == -1 {
		fail(c, http.StatusNotFound, "分类不存在")
		return
	}
	for _, item := range s.categories {
		if item.ID != id && strings.EqualFold(item.Name, req.Name) {
			fail(c, http.StatusBadRequest, "分类名称重复")
			return
		}
	}

	s.categories[idx].Name = req.Name
	if req.Sort > 0 {
		s.categories[idx].Sort = req.Sort
	}
	if req.Status != "" {
		s.categories[idx].Status = req.Status
	}
	s.categories[idx].UpdatedAt = nowText()
	s.appendOperation("分类管理", "编辑分类", "编辑分类："+req.Name, user)
	ok(c, gin.H{})
}

func (s *Store) deleteCategory(c *gin.Context) {
	id := c.Param("id")
	user := s.getUserFromContext(c)

	s.mu.Lock()
	defer s.mu.Unlock()

	for _, dish := range s.dishes {
		if dish.CategoryID == id {
			fail(c, http.StatusBadRequest, "该分类下仍有菜品，无法删除")
			return
		}
	}

	idx := -1
	name := ""
	for i := range s.categories {
		if s.categories[i].ID == id {
			idx = i
			name = s.categories[i].Name
			break
		}
	}
	if idx == -1 {
		fail(c, http.StatusNotFound, "分类不存在")
		return
	}

	s.categories = append(s.categories[:idx], s.categories[idx+1:]...)
	s.appendOperation("分类管理", "删除分类", "删除分类："+name, user)
	ok(c, gin.H{})
}

func (s *Store) toggleCategoryStatus(c *gin.Context) {
	id := c.Param("id")
	user := s.getUserFromContext(c)

	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.categories {
		if s.categories[i].ID == id {
			if s.categories[i].Status == StatusEnabled {
				s.categories[i].Status = StatusDisabled
			} else {
				s.categories[i].Status = StatusEnabled
			}
			s.categories[i].UpdatedAt = nowText()
			s.appendOperation("分类管理", "切换状态", fmt.Sprintf("分类%s状态切换为%s", s.categories[i].Name, s.categories[i].Status), user)
			ok(c, gin.H{})
			return
		}
	}
	fail(c, http.StatusNotFound, "分类不存在")
}

func (s *Store) listDishes(c *gin.Context) {
	keyword := strings.ToLower(strings.TrimSpace(c.Query("keyword")))
	categoryID := strings.TrimSpace(c.Query("categoryId"))
	status := strings.TrimSpace(c.Query("status"))

	s.mu.RLock()
	list := append([]Dish(nil), s.dishes...)
	s.mu.RUnlock()

	result := make([]Dish, 0, len(list))
	for _, item := range list {
		if keyword != "" && !strings.Contains(strings.ToLower(item.Name), keyword) {
			continue
		}
		if categoryID != "" && item.CategoryID != categoryID {
			continue
		}
		if status != "" && item.Status != status {
			continue
		}
		result = append(result, item)
	}
	ok(c, result)
}

func (s *Store) createDish(c *gin.Context) {
	var req struct {
		CategoryID  string  `json:"categoryId"`
		Name        string  `json:"name"`
		Price       float64 `json:"price"`
		Stock       int     `json:"stock"`
		Status      string  `json:"status"`
		Image       string  `json:"image"`
		Description string  `json:"description"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, "请求参数错误")
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" || strings.TrimSpace(req.CategoryID) == "" {
		fail(c, http.StatusBadRequest, "菜品名称和分类不能为空")
		return
	}
	if req.Status == "" {
		req.Status = "on"
	}

	user := s.getUserFromContext(c)
	s.mu.Lock()
	defer s.mu.Unlock()

	for _, item := range s.dishes {
		if strings.EqualFold(item.Name, req.Name) {
			fail(c, http.StatusBadRequest, "菜品名称重复")
			return
		}
	}

	dish := Dish{
		ID:          newID("dish"),
		CategoryID:  req.CategoryID,
		Name:        req.Name,
		Price:       req.Price,
		Stock:       req.Stock,
		Sales:       0,
		Status:      req.Status,
		Image:       strings.TrimSpace(req.Image),
		Description: strings.TrimSpace(req.Description),
		UpdatedAt:   nowText(),
	}
	s.dishes = append([]Dish{dish}, s.dishes...)
	s.appendOperation("菜品管理", "新增菜品", "新增菜品："+dish.Name, user)
	ok(c, gin.H{})
}

func (s *Store) updateDish(c *gin.Context) {
	id := c.Param("id")
	var req Dish
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, "请求参数错误")
		return
	}

	if strings.TrimSpace(req.Name) == "" || strings.TrimSpace(req.CategoryID) == "" {
		fail(c, http.StatusBadRequest, "菜品名称和分类不能为空")
		return
	}

	user := s.getUserFromContext(c)
	s.mu.Lock()
	defer s.mu.Unlock()

	idx := -1
	for i := range s.dishes {
		if s.dishes[i].ID == id {
			idx = i
			break
		}
	}
	if idx == -1 {
		fail(c, http.StatusNotFound, "菜品不存在")
		return
	}

	s.dishes[idx].CategoryID = req.CategoryID
	s.dishes[idx].Name = strings.TrimSpace(req.Name)
	s.dishes[idx].Price = req.Price
	s.dishes[idx].Stock = req.Stock
	if req.Status != "" {
		s.dishes[idx].Status = req.Status
	}
	s.dishes[idx].Image = strings.TrimSpace(req.Image)
	s.dishes[idx].Description = strings.TrimSpace(req.Description)
	s.dishes[idx].UpdatedAt = nowText()
	s.appendOperation("菜品管理", "编辑菜品", "编辑菜品："+s.dishes[idx].Name, user)
	ok(c, gin.H{})
}

func (s *Store) deleteDish(c *gin.Context) {
	id := c.Param("id")
	user := s.getUserFromContext(c)

	s.mu.Lock()
	defer s.mu.Unlock()

	idx := -1
	name := ""
	for i := range s.dishes {
		if s.dishes[i].ID == id {
			idx = i
			name = s.dishes[i].Name
			break
		}
	}
	if idx == -1 {
		fail(c, http.StatusNotFound, "菜品不存在")
		return
	}

	s.dishes = append(s.dishes[:idx], s.dishes[idx+1:]...)
	s.appendOperation("菜品管理", "删除菜品", "删除菜品："+name, user)
	ok(c, gin.H{})
}

func (s *Store) toggleDishStatus(c *gin.Context) {
	id := c.Param("id")
	user := s.getUserFromContext(c)

	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.dishes {
		if s.dishes[i].ID == id {
			if s.dishes[i].Status == "on" {
				s.dishes[i].Status = "off"
			} else {
				s.dishes[i].Status = "on"
			}
			s.dishes[i].UpdatedAt = nowText()
			actionText := "下架"
			if s.dishes[i].Status == "on" {
				actionText = "上架"
			}
			s.appendOperation("菜品管理", "上下架", fmt.Sprintf("菜品%s%s", s.dishes[i].Name, actionText), user)
			ok(c, gin.H{})
			return
		}
	}
	fail(c, http.StatusNotFound, "菜品不存在")
}

func (s *Store) listOrders(c *gin.Context) {
	keyword := strings.ToLower(strings.TrimSpace(c.Query("keyword")))
	status := strings.TrimSpace(c.Query("status"))
	date := strings.TrimSpace(c.Query("date"))

	s.mu.RLock()
	list := cloneOrders(s.orders)
	s.mu.RUnlock()

	result := make([]Order, 0, len(list))
	for _, order := range list {
		if keyword != "" {
			if !strings.Contains(strings.ToLower(order.ID), keyword) && !strings.Contains(strings.ToLower(order.UserName), keyword) {
				continue
			}
		}
		if status != "" && order.Status != status {
			continue
		}
		if date != "" && !strings.HasPrefix(order.CreatedAt, date) {
			continue
		}
		result = append(result, order)
	}

	sort.Slice(result, func(i, j int) bool { return result[i].CreatedAt > result[j].CreatedAt })
	ok(c, result)
}

func (s *Store) updateOrderStatus(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Status string `json:"status"`
		Remark string `json:"remark"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, "请求参数错误")
		return
	}
	if strings.TrimSpace(req.Status) == "" {
		fail(c, http.StatusBadRequest, "目标状态不能为空")
		return
	}

	user := s.getUserFromContext(c)
	s.mu.Lock()
	defer s.mu.Unlock()

	idx := -1
	for i := range s.orders {
		if s.orders[i].ID == id {
			idx = i
			break
		}
	}
	if idx == -1 {
		fail(c, http.StatusNotFound, "订单不存在")
		return
	}

	current := s.orders[idx].Status
	allow := orderStatusFlow[current]
	if !containsAny(allow, req.Status) {
		fail(c, http.StatusBadRequest, fmt.Sprintf("状态流转非法：%s -> %s", current, req.Status))
		return
	}

	now := nowText()
	s.orders[idx].Status = req.Status
	s.orders[idx].UpdatedAt = now
	remark := strings.TrimSpace(req.Remark)
	if remark == "" {
		remark = "订单状态更新为" + req.Status
	}
	logItem := OrderLog{
		ID:           newID("olog"),
		Action:       "status:" + req.Status,
		OperatorID:   user.ID,
		OperatorName: user.Name,
		Source:       "admin",
		Time:         now,
		Remark:       remark,
	}
	s.orders[idx].Logs = append([]OrderLog{logItem}, s.orders[idx].Logs...)
	s.appendOperation("订单管理", "状态流转", fmt.Sprintf("订单%s流转到%s", s.orders[idx].ID, req.Status), user)
	ok(c, gin.H{})
}

func (s *Store) listAppUsers(c *gin.Context) {
	s.mu.RLock()
	list := append([]AppUser(nil), s.appUsers...)
	s.mu.RUnlock()
	ok(c, list)
}

func (s *Store) toggleAppUserStatus(c *gin.Context) {
	id := c.Param("id")
	user := s.getUserFromContext(c)

	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.appUsers {
		if s.appUsers[i].ID == id {
			if s.appUsers[i].Status == StatusEnabled {
				s.appUsers[i].Status = StatusDisabled
			} else {
				s.appUsers[i].Status = StatusEnabled
			}
			s.appendOperation("用户管理", "用户状态变更", fmt.Sprintf("小程序用户%s状态改为%s", s.appUsers[i].Nickname, s.appUsers[i].Status), user)
			ok(c, gin.H{})
			return
		}
	}
	fail(c, http.StatusNotFound, "用户不存在")
}

func (s *Store) listAdminUsers(c *gin.Context) {
	s.mu.RLock()
	list := make([]AdminAccount, len(s.admins))
	for i := range s.admins {
		item := s.admins[i]
		item.Password = ""
		list[i] = item
	}
	s.mu.RUnlock()
	ok(c, list)
}

func (s *Store) createAdminUser(c *gin.Context) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
		Name     string `json:"name"`
		Role     string `json:"role"`
		Status   string `json:"status"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, "请求参数错误")
		return
	}

	req.Username = strings.TrimSpace(req.Username)
	req.Name = strings.TrimSpace(req.Name)
	if req.Username == "" || req.Name == "" || strings.TrimSpace(req.Password) == "" {
		fail(c, http.StatusBadRequest, "账号、姓名、密码不能为空")
		return
	}
	if !containsAny([]string{RoleAdmin, RoleManager, RoleClerk}, req.Role) {
		fail(c, http.StatusBadRequest, "角色非法")
		return
	}
	if req.Status == "" {
		req.Status = StatusEnabled
	}
	if !containsAny([]string{StatusEnabled, StatusDisabled}, req.Status) {
		fail(c, http.StatusBadRequest, "状态非法")
		return
	}

	user := s.getUserFromContext(c)
	s.mu.Lock()
	defer s.mu.Unlock()

	for _, item := range s.admins {
		if item.Username == req.Username {
			fail(c, http.StatusBadRequest, "账号已存在")
			return
		}
	}

	s.admins = append([]AdminAccount{{
		ID:        newID("admin"),
		Username:  req.Username,
		Password:  req.Password,
		Name:      req.Name,
		Role:      req.Role,
		Status:    req.Status,
		CreatedAt: nowText(),
	}}, s.admins...)

	s.appendOperation("用户管理", "新增管理员", "新增管理员账号："+req.Username, user)
	ok(c, gin.H{})
}

func (s *Store) updateAdminUser(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Name     string `json:"name"`
		Role     string `json:"role"`
		Status   string `json:"status"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, "请求参数错误")
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		fail(c, http.StatusBadRequest, "姓名不能为空")
		return
	}
	if !containsAny([]string{RoleAdmin, RoleManager, RoleClerk}, req.Role) {
		fail(c, http.StatusBadRequest, "角色非法")
		return
	}
	if !containsAny([]string{StatusEnabled, StatusDisabled}, req.Status) {
		fail(c, http.StatusBadRequest, "状态非法")
		return
	}

	user := s.getUserFromContext(c)
	s.mu.Lock()
	defer s.mu.Unlock()

	idx := -1
	for i := range s.admins {
		if s.admins[i].ID == id {
			idx = i
			break
		}
	}
	if idx == -1 {
		fail(c, http.StatusNotFound, "管理员不存在")
		return
	}

	if user.ID == s.admins[idx].ID && req.Status == StatusDisabled {
		fail(c, http.StatusBadRequest, "不能停用当前登录账号")
		return
	}

	s.admins[idx].Name = req.Name
	s.admins[idx].Role = req.Role
	s.admins[idx].Status = req.Status
	if strings.TrimSpace(req.Password) != "" {
		s.admins[idx].Password = req.Password
	}

	s.appendOperation("用户管理", "编辑管理员", "编辑管理员："+s.admins[idx].Username, user)
	ok(c, gin.H{})
}

func (s *Store) getStoreSetting(c *gin.Context) {
	s.mu.RLock()
	setting := s.storeSetting
	setting.BannerImages = append([]string(nil), setting.BannerImages...)
	s.mu.RUnlock()
	ok(c, setting)
}

func (s *Store) updateStoreSetting(c *gin.Context) {
	var req StoreSetting
	if err := c.ShouldBindJSON(&req); err != nil {
		fail(c, http.StatusBadRequest, "请求参数错误")
		return
	}

	user := s.getUserFromContext(c)
	s.mu.Lock()
	defer s.mu.Unlock()

	if strings.TrimSpace(req.StoreName) == "" {
		fail(c, http.StatusBadRequest, "门店名称不能为空")
		return
	}
	req.BannerImages = append([]string(nil), req.BannerImages...)
	s.storeSetting = req
	s.appendOperation("门店配置", "更新配置", "更新门店基础配置", user)
	ok(c, gin.H{})
}

func (s *Store) listOperationLogs(c *gin.Context) {
	limit := 20
	if q := strings.TrimSpace(c.Query("limit")); q != "" {
		if v, err := strconv.Atoi(q); err == nil && v > 0 {
			limit = v
		}
	}

	s.mu.RLock()
	list := append([]OperationLog(nil), s.operationLogs...)
	s.mu.RUnlock()

	if limit > len(list) {
		limit = len(list)
	}
	ok(c, list[:limit])
}

func seedStore() *Store {
	now := nowText()
	store := &Store{
		tokens: make(map[string]SessionUser),
		admins: []AdminAccount{
			{ID: "admin-1", Username: "admin", Password: "123456", Name: "系统管理员", Role: RoleAdmin, Status: StatusEnabled, CreatedAt: now},
			{ID: "manager-1", Username: "manager", Password: "123456", Name: "门店店长", Role: RoleManager, Status: StatusEnabled, CreatedAt: now},
			{ID: "clerk-1", Username: "clerk", Password: "123456", Name: "前台店员", Role: RoleClerk, Status: StatusEnabled, CreatedAt: now},
		},
		appUsers: []AppUser{
			{ID: "u-1001", Nickname: "顾客小张", Phone: "13800001111", Avatar: "https://picsum.photos/seed/customer1/96/96", Status: StatusEnabled, OrderCount: 12, TotalSpent: 468, CreatedAt: now},
			{ID: "u-1002", Nickname: "顾客小李", Phone: "13800002222", Avatar: "https://picsum.photos/seed/customer2/96/96", Status: StatusEnabled, OrderCount: 6, TotalSpent: 189, CreatedAt: now},
			{ID: "u-1003", Nickname: "顾客小王", Phone: "13800003333", Avatar: "https://picsum.photos/seed/customer3/96/96", Status: StatusDisabled, OrderCount: 2, TotalSpent: 76, CreatedAt: now},
		},
		categories: []Category{
			{ID: "c-1", Name: "热菜", Sort: 1, Status: StatusEnabled, CreatedAt: now, UpdatedAt: now},
			{ID: "c-2", Name: "凉菜", Sort: 2, Status: StatusEnabled, CreatedAt: now, UpdatedAt: now},
			{ID: "c-3", Name: "主食", Sort: 3, Status: StatusEnabled, CreatedAt: now, UpdatedAt: now},
			{ID: "c-4", Name: "饮品", Sort: 4, Status: StatusEnabled, CreatedAt: now, UpdatedAt: now},
		},
		dishes: []Dish{
			{ID: "d-1", CategoryID: "c-1", Name: "宫保鸡丁", Price: 28, Stock: 60, Sales: 128, Status: "on", Image: "https://picsum.photos/seed/kungpao/320/200", Description: "经典川味热菜，鸡丁鲜嫩，花生香脆。", UpdatedAt: now},
			{ID: "d-2", CategoryID: "c-1", Name: "麻婆豆腐", Price: 22, Stock: 80, Sales: 96, Status: "on", Image: "https://picsum.photos/seed/tofu/320/200", Description: "豆腐滑嫩入味，麻辣开胃。", UpdatedAt: now},
			{ID: "d-3", CategoryID: "c-2", Name: "凉拌黄瓜", Price: 12, Stock: 100, Sales: 75, Status: "on", Image: "https://picsum.photos/seed/cucumber/320/200", Description: "清爽解腻，蒜香十足。", UpdatedAt: now},
			{ID: "d-4", CategoryID: "c-4", Name: "酸梅汤", Price: 8, Stock: 40, Sales: 64, Status: "off", Image: "https://picsum.photos/seed/plum/320/200", Description: "冰爽解辣，酸甜适口。", UpdatedAt: now},
		},
		orders: []Order{
			{
				ID:       "OD20260331001",
				UserID:   "u-1001",
				UserName: "顾客小张",
				Type:     "dine_in",
				TableNo:  "A12",
				Remark:   "少辣",
				Status:   "pending",
				Items: []OrderItem{
					{DishID: "d-1", NameSnapshot: "宫保鸡丁", PriceSnapshot: 28, Quantity: 1, ServedQty: 0},
					{DishID: "d-3", NameSnapshot: "凉拌黄瓜", PriceSnapshot: 12, Quantity: 1, ServedQty: 0},
				},
				TotalAmount: 40,
				CreatedAt:   now,
				UpdatedAt:   now,
				Logs: []OrderLog{
					{ID: newID("olog"), Action: "create", OperatorID: "u-1001", OperatorName: "顾客小张", Source: "mini", Time: now, Remark: "用户提交订单，等待接单"},
				},
			},
			{
				ID:           "OD20260331002",
				UserID:       "u-1002",
				UserName:     "顾客小李",
				Type:         "takeaway",
				ContactPhone: "13800002222",
				Status:       "completed",
				Items: []OrderItem{
					{DishID: "d-2", NameSnapshot: "麻婆豆腐", PriceSnapshot: 22, Quantity: 2, ServedQty: 2},
					{DishID: "d-4", NameSnapshot: "酸梅汤", PriceSnapshot: 8, Quantity: 1, ServedQty: 1},
				},
				TotalAmount: 52,
				CreatedAt:   now,
				UpdatedAt:   now,
				Logs: []OrderLog{
					{ID: newID("olog"), Action: "create", OperatorID: "u-1002", OperatorName: "顾客小李", Source: "mini", Time: now, Remark: "用户提交订单"},
					{ID: newID("olog"), Action: "status:completed", OperatorID: "manager-1", OperatorName: "门店店长", Source: "admin", Time: now, Remark: "订单完成"},
				},
			},
		},
		storeSetting: StoreSetting{
			StoreName:      "学苑餐厅",
			BusinessHours:  "09:00-22:00",
			Phone:          "020-88886666",
			Notice:         "午高峰请耐心等候，感谢理解。",
			MinDeliveryFee: 20,
			DeliveryFee:    4,
			BannerImages: []string{
				"https://picsum.photos/seed/banner1/960/260",
				"https://picsum.photos/seed/banner2/960/260",
			},
		},
		operationLogs: []OperationLog{},
	}

	return store
}
