USE sentinelx;

-- ============================================================
-- Seed Roles
-- ============================================================
INSERT INTO ROLES (role_id, role_name) VALUES
  (1, 'Admin'),
  (2, 'Security Analyst'),
  (3, 'Employee');

-- ============================================================
-- Seed Departments
-- ============================================================
INSERT INTO DEPARTMENTS (department_id, department_name) VALUES
  (1, 'Security'),
  (2, 'Finance'),
  (3, 'Engineering'),
  (4, 'GRC'),
  (5, 'Platform');

-- ============================================================
-- Seed Users (passwords hashed via werkzeug)
-- admin123, analyst123, emp123
-- ============================================================
INSERT INTO USERS (user_id, username, password_hash, role_id, department_id, risk_score, is_active) VALUES
  (1, 'admin',    'scrypt:32768:8:1$ZBeQYB8tDMDoGcC3$be6c69c36c17a48d8dbd4f825c2ac55fefd787c2f4603e761e6aa26403cbd5a1d5e542652b8e7e859dfa23b382df4dc7075bfa58f4038617539a9b30252cdf72',    1, 1, 18.00, TRUE),
  (2, 'analyst',  'scrypt:32768:8:1$JYbDD6bOAeESB7Xc$a9fb2ce0b4258ca3dd2296af3d45cfa04806fee85edc342b93c495db32707b6ae4c3c005e4040b7293394397d14497baf261c4fe41f8d6035066d6b848d51b63',  2, 1, 36.00, TRUE),
  (3, 'employee', 'scrypt:32768:8:1$MjBRzyXvMceuwSgF$5bdc71cdc8a8e2ec2770df7c5fc96300dbe9b7c339b1b7e51906f1f2d6a382217e0d601fc878c2d5c94e18227f9592f02c9ff7207e1c97384c1128a69d50a360',      3, 3,  30.00, TRUE);

-- ============================================================
-- Seed Resources
-- ============================================================
INSERT INTO RESOURCES (resource_id, resource_name, resource_type, department_id, is_sensitive) VALUES
  (1, 'Policy_Manual.pdf',            'Normal',     4, FALSE),
  (2, 'Knowledge_Base.md',            'Normal',     1, FALSE),
  (3, 'Decoy_Payroll_Master.csv',     'Honeytoken', 2, TRUE),
  (4, 'Honeytoken_Admin_Secrets.txt', 'Honeytoken', 5, TRUE),
  (5, 'IAM_Audit_Policy.yaml',       'Critical',   1, TRUE);

-- ============================================================
-- Seed Honeytokens
-- ============================================================
INSERT INTO HONEYTOKENS (token_id, resource_id, token_name, token_value, risk_points, is_active) VALUES
  (1, 3, 'Payroll_Decoy_Token',   'DECOY-PAYROLL-2026',   18, TRUE),
  (2, 4, 'Admin_Creds_Decoy',     'DECOY-ADMIN-KEY-2026', 24, TRUE);

-- ============================================================
-- Seed Access Logs
-- ============================================================
INSERT INTO ACCESS_LOGS (log_id, user_id, resource_id, token_id, access_type, ip_address, is_honeytoken, access_time) VALUES
  (101, 3, 1, NULL, 'READ',   '10.0.1.18', FALSE, '2026-04-20 10:26:00'),
  (102, 2, 3, 1,    'READ',   '10.0.2.71', TRUE,  '2026-04-20 10:42:00'),
  (103, 3, 4, 2,    'EXPORT', '10.0.1.18', TRUE,  '2026-04-20 11:04:00'),
  (104, 1, 5, NULL, 'WRITE',  '10.0.0.12', FALSE, '2026-04-20 11:19:00');

-- ============================================================
-- Seed Alerts
-- ============================================================
INSERT INTO ALERTS (alert_id, user_id, access_log_id, alert_type, severity, message, status) VALUES
  (7001, 2, 102, 'HONEYTOKEN_ACCESS', 'HIGH',     'Decoy finance export accessed from unusual subnet.', 'OPEN'),
  (7002, 3, 103, 'HONEYTOKEN_ACCESS', 'CRITICAL', 'Credential-like decoy token exported by employee account.', 'OPEN');

-- ============================================================
-- Seed Risk History
-- ============================================================
INSERT INTO RISK_HISTORY (user_id, old_score, points_added, new_score, reason, event_time) VALUES
  (1, 12.00, 6,  18.00, 'Multiple role assignment operations',    '2026-04-20 11:19:00'),
  (2, 18.00, 18, 36.00, 'Honeytoken access event',               '2026-04-20 10:42:00'),
  (3,  6.00, 24, 30.00, 'Honeytoken credential export',          '2026-04-20 11:04:00');

-- ============================================================
-- Seed Audit Trail
-- ============================================================
INSERT INTO AUDIT_TRAIL (actor_user_id, action, target_type, target_id, metadata) VALUES
  (1, 'REVIEW_ALERT', 'ALERT', '7002', 'Escalated to incident response channel.');

-- ============================================================
-- Seed Login History
-- ============================================================
INSERT INTO LOGIN_HISTORY (user_id, username_attempted, ip_address, user_agent, login_status, failure_reason) VALUES
  (1, 'admin',    '127.0.0.1', 'SentinelX-Browser/1.0', 'SUCCESS', NULL),
  (2, 'analyst',  '127.0.0.1', 'SentinelX-Browser/1.0', 'SUCCESS', NULL),
  (3, 'employee', '127.0.0.1', 'SentinelX-Browser/1.0', 'SUCCESS', NULL);

-- ============================================================
-- Triggers
-- ============================================================

-- Trigger: Auto-generate alert when honeytoken access is logged
DELIMITER //
CREATE TRIGGER trg_honeytoken_alert
AFTER INSERT ON ACCESS_LOGS
FOR EACH ROW
BEGIN
    DECLARE v_risk_points INT DEFAULT 10;
    DECLARE v_severity ENUM('LOW','MEDIUM','HIGH','CRITICAL') DEFAULT 'MEDIUM';

    IF NEW.is_honeytoken = TRUE THEN
        -- Look up risk points from the honeytoken
        SELECT risk_points INTO v_risk_points
        FROM HONEYTOKENS
        WHERE token_id = NEW.token_id
        LIMIT 1;

        IF v_risk_points >= 20 THEN
            SET v_severity = 'CRITICAL';
        ELSEIF v_risk_points >= 10 THEN
            SET v_severity = 'HIGH';
        END IF;

        INSERT INTO ALERTS (user_id, access_log_id, alert_type, severity, message, status)
        VALUES (
            NEW.user_id,
            NEW.log_id,
            'HONEYTOKEN_ACCESS',
            v_severity,
            CONCAT('Honeytoken triggered: user_id=', NEW.user_id, ', resource_id=', NEW.resource_id, ', token_id=', NEW.token_id),
            'OPEN'
        );
    END IF;
END;
//

-- Trigger: Auto-update risk score when honeytoken access is logged
CREATE TRIGGER trg_honeytoken_risk_update
AFTER INSERT ON ACCESS_LOGS
FOR EACH ROW
BEGIN
    DECLARE v_risk_points INT DEFAULT 0;
    DECLARE v_old_score DECIMAL(10,2) DEFAULT 0;

    IF NEW.is_honeytoken = TRUE AND NEW.token_id IS NOT NULL THEN
        SELECT risk_points INTO v_risk_points
        FROM HONEYTOKENS
        WHERE token_id = NEW.token_id
        LIMIT 1;

        SELECT risk_score INTO v_old_score
        FROM USERS
        WHERE user_id = NEW.user_id
        LIMIT 1;

        UPDATE USERS
        SET risk_score = risk_score + v_risk_points
        WHERE user_id = NEW.user_id;

        INSERT INTO RISK_HISTORY (user_id, old_score, points_added, new_score, reason)
        VALUES (
            NEW.user_id,
            v_old_score,
            v_risk_points,
            v_old_score + v_risk_points,
            CONCAT('Honeytoken access detected for resource_id=', NEW.resource_id, ', token_id=', NEW.token_id)
        );
    END IF;
END;
//

DELIMITER ;
