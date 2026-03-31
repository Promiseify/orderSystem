# system-server

Go 后台服务（Gin）实现，接口与 `system-ui` 当前 API 规范对齐。

## 运行

```bash
go mod tidy
go run .
```

默认端口 `8080`，可通过环境变量 `PORT` 修改。

## 默认账号

- `admin / 123456`（超级管理员）
- `manager / 123456`（店长）
- `clerk / 123456`（店员）

## 已实现接口

- `POST /api/admin/auth/login`
- `GET /api/admin/auth/profile`
- `POST /api/admin/auth/logout`
- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `PUT /api/admin/categories/:id`
- `DELETE /api/admin/categories/:id`
- `PATCH /api/admin/categories/:id/status`
- `GET /api/admin/dishes`
- `POST /api/admin/dishes`
- `PUT /api/admin/dishes/:id`
- `DELETE /api/admin/dishes/:id`
- `PATCH /api/admin/dishes/:id/status`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/:id/status`
- `GET /api/admin/app-users`
- `PATCH /api/admin/app-users/:id/status`
- `GET /api/admin/admin-users`
- `POST /api/admin/admin-users`
- `PUT /api/admin/admin-users/:id`
- `GET /api/admin/store-setting`
- `PUT /api/admin/store-setting`
- `GET /api/admin/operation-logs`

## 说明

- 当前实现使用内存数据（含初始化种子数据），重启服务会重置。
- 使用 `Authorization: Bearer <token>` 做登录态校验。
- 返回格式统一为：`{ code, msg, data }`。
