CREATE DATABASE IF NOT EXISTS order_system
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE order_system;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS operation_log;
DROP TABLE IF EXISTS store_setting;
DROP TABLE IF EXISTS order_log;
DROP TABLE IF EXISTS order_item;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS dish;
DROP TABLE IF EXISTS dish_category;
DROP TABLE IF EXISTS app_user;
DROP TABLE IF EXISTS sys_admin_role;
DROP TABLE IF EXISTS sys_role;
DROP TABLE IF EXISTS sys_admin;
DROP TABLE IF EXISTS sys_admin_token;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE sys_role (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  role_code      VARCHAR(32) NOT NULL COMMENT 'admin/manager/clerk',
  role_name      VARCHAR(64) NOT NULL,
  status         TINYINT NOT NULL DEFAULT 1 COMMENT '1启用 0停用',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_role_code (role_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统角色';

CREATE TABLE sys_admin (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username      VARCHAR(64) NOT NULL,
  password      VARCHAR(128) NOT NULL COMMENT '演示环境可明文，生产请存加密哈希',
  name          VARCHAR(64) NOT NULL,
  role_code     VARCHAR(32) NOT NULL COMMENT '与前端接口保持一致：admin/manager/clerk',
  status        TINYINT NOT NULL DEFAULT 1 COMMENT '1启用 0停用',
  last_login_at DATETIME NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_admin_username (username),
  KEY idx_admin_role (role_code),
  KEY idx_admin_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='后台管理员';

CREATE TABLE sys_admin_role (
  admin_id      BIGINT UNSIGNED NOT NULL,
  role_id       BIGINT UNSIGNED NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (admin_id, role_id),
  CONSTRAINT fk_admin_role_admin FOREIGN KEY (admin_id) REFERENCES sys_admin(id),
  CONSTRAINT fk_admin_role_role  FOREIGN KEY (role_id) REFERENCES sys_role(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员角色关联';

CREATE TABLE sys_admin_token (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_id      BIGINT UNSIGNED NOT NULL,
  token         VARCHAR(128) NOT NULL,
  expired_at    DATETIME NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_admin_token (token),
  KEY idx_token_admin (admin_id),
  KEY idx_token_expired (expired_at),
  CONSTRAINT fk_token_admin FOREIGN KEY (admin_id) REFERENCES sys_admin(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员登录会话';

CREATE TABLE app_user (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nickname      VARCHAR(64) NOT NULL,
  phone         VARCHAR(20) DEFAULT NULL,
  avatar        VARCHAR(255) DEFAULT NULL,
  status        TINYINT NOT NULL DEFAULT 1 COMMENT '1正常 0停用',
  order_count   INT NOT NULL DEFAULT 0,
  total_spent   DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_app_user_status (status),
  KEY idx_app_user_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='小程序用户';

CREATE TABLE dish_category (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(64) NOT NULL,
  sort_no       INT NOT NULL DEFAULT 1,
  status        TINYINT NOT NULL DEFAULT 1 COMMENT '1启用 0停用',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_category_name (name),
  KEY idx_category_sort (sort_no),
  KEY idx_category_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='菜品分类';

CREATE TABLE dish (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id    BIGINT UNSIGNED NOT NULL,
  name          VARCHAR(128) NOT NULL,
  price         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  stock         INT NOT NULL DEFAULT 0,
  sales         INT NOT NULL DEFAULT 0,
  status        TINYINT NOT NULL DEFAULT 1 COMMENT '1上架 0下架',
  image         VARCHAR(255) DEFAULT NULL,
  description   VARCHAR(500) DEFAULT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_dish_category (category_id),
  KEY idx_dish_status (status),
  KEY idx_dish_name (name),
  CONSTRAINT fk_dish_category FOREIGN KEY (category_id) REFERENCES dish_category(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='菜品';

CREATE TABLE orders (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_no        VARCHAR(40) NOT NULL COMMENT '业务订单号',
  app_user_id     BIGINT UNSIGNED DEFAULT NULL,
  user_name       VARCHAR(64) NOT NULL COMMENT '下单时用户快照',
  order_type      VARCHAR(20) NOT NULL COMMENT 'dine_in/takeaway',
  table_no        VARCHAR(32) DEFAULT NULL,
  contact_phone   VARCHAR(20) DEFAULT NULL,
  remark          VARCHAR(500) DEFAULT NULL,
  status          VARCHAR(20) NOT NULL COMMENT 'pending/accepted/cooking/ready/served/completed/cancelled/rejected',
  total_amount    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_orders_no (order_no),
  KEY idx_orders_user (app_user_id),
  KEY idx_orders_status_time (status, created_at),
  CONSTRAINT fk_orders_app_user FOREIGN KEY (app_user_id) REFERENCES app_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单主表';

CREATE TABLE order_item (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id          BIGINT UNSIGNED NOT NULL,
  dish_id           BIGINT UNSIGNED DEFAULT NULL,
  name_snapshot     VARCHAR(128) NOT NULL,
  price_snapshot    DECIMAL(10,2) NOT NULL,
  quantity          INT NOT NULL DEFAULT 1,
  served_quantity   INT NOT NULL DEFAULT 0,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_order_item_order (order_id),
  KEY idx_order_item_dish (dish_id),
  CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_item_dish  FOREIGN KEY (dish_id) REFERENCES dish(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单明细';

CREATE TABLE order_log (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id         BIGINT UNSIGNED NOT NULL,
  action           VARCHAR(64) NOT NULL COMMENT 'create/status:accepted...',
  operator_admin_id BIGINT UNSIGNED DEFAULT NULL,
  operator_name    VARCHAR(64) NOT NULL,
  source           VARCHAR(20) NOT NULL COMMENT 'admin/mini',
  remark           VARCHAR(500) DEFAULT NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_order_log_order_time (order_id, created_at),
  KEY idx_order_log_operator (operator_admin_id),
  CONSTRAINT fk_order_log_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_log_admin FOREIGN KEY (operator_admin_id) REFERENCES sys_admin(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单状态日志';

CREATE TABLE store_setting (
  id               TINYINT UNSIGNED NOT NULL,
  store_name       VARCHAR(128) NOT NULL,
  business_hours   VARCHAR(64) DEFAULT NULL,
  phone            VARCHAR(20) DEFAULT NULL,
  notice           VARCHAR(500) DEFAULT NULL,
  min_delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  delivery_fee     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  banner_images    JSON DEFAULT NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='门店配置';

CREATE TABLE operation_log (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  module          VARCHAR(64) NOT NULL,
  action          VARCHAR(64) NOT NULL,
  operator_admin_id BIGINT UNSIGNED DEFAULT NULL,
  operator_name   VARCHAR(64) NOT NULL,
  detail          VARCHAR(500) DEFAULT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_operation_time (created_at),
  KEY idx_operation_module (module),
  KEY idx_operation_operator (operator_admin_id),
  CONSTRAINT fk_operation_admin FOREIGN KEY (operator_admin_id) REFERENCES sys_admin(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志';

INSERT INTO sys_role (role_code, role_name, status) VALUES
('admin', '超级管理员', 1),
('manager', '店长', 1),
('clerk', '店员', 1);

INSERT INTO sys_admin (username, password, name, role_code, status) VALUES
('admin', '123456', '系统管理员', 'admin', 1),
('manager', '123456', '门店店长', 'manager', 1),
('clerk', '123456', '前台店员', 'clerk', 1);

INSERT INTO sys_admin_role (admin_id, role_id)
SELECT a.id, r.id
FROM sys_admin a
JOIN sys_role r ON a.role_code = r.role_code;

INSERT INTO store_setting (
  id, store_name, business_hours, phone, notice, min_delivery_fee, delivery_fee, banner_images
) VALUES (
  1, '学苑餐厅', '09:00-22:00', '020-88886666', '午高峰请耐心等候，感谢理解。', 20.00, 4.00,
  JSON_ARRAY('https://picsum.photos/seed/banner1/960/260', 'https://picsum.photos/seed/banner2/960/260')
);
