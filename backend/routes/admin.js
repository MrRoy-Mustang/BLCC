"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var db_1 = require("../utils/db");
var auth_1 = require("../middleware/auth");
var bcryptjs_1 = require("bcryptjs");
var router = (0, express_1.Router)();
// Admin login
router.post('/login', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var password, ADMIN_PASSWORD, jwt, JWT_SECRET, token;
    return __generator(this, function (_a) {
        try {
            password = req.body.password;
            if (!password) {
                return [2 /*return*/, res.status(400).json({ error: 'Password required' })];
            }
            ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
            if (!ADMIN_PASSWORD) {
                return [2 /*return*/, res.status(500).json({ error: 'Admin password not configured' })];
            }
            if (password !== ADMIN_PASSWORD) {
                return [2 /*return*/, res.status(401).json({ error: 'Invalid password' })];
            }
            jwt = require('jsonwebtoken');
            JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
            token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
            res.json({ token: token, role: 'admin' });
        }
        catch (error) {
            console.error('Admin login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
        return [2 /*return*/];
    });
}); });
// Get statistics
router.get('/stats', auth_1.authenticate, auth_1.requireAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, standard, vip, scanned, totalIssued, capacity, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                return [4 /*yield*/, Promise.all([
                        (0, db_1.query)("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM transactions WHERE status = 'PAID' AND pass_type = 'STANDARD'"),
                        (0, db_1.query)("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM transactions WHERE status = 'PAID' AND pass_type = 'REGULAR_VIP'"),
                        (0, db_1.query)("SELECT COUNT(*) as count FROM tickets WHERE status = 'USED'"),
                        (0, db_1.query)("SELECT COUNT(*) as count FROM tickets"),
                    ])];
            case 1:
                _a = _b.sent(), standard = _a[0], vip = _a[1], scanned = _a[2], totalIssued = _a[3];
                capacity = Number(process.env.EVENT_CAPACITY) || totalIssued.rows[0].count;
                res.json({
                    totalRevenue: (standard.rows[0].total || 0) + (vip.rows[0].total || 0),
                    standard: { count: standard.rows[0].count, total: standard.rows[0].total || 0 },
                    vip: { count: vip.rows[0].count, total: vip.rows[0].total || 0 },
                    gate: { scanned: scanned.rows[0].count, capacity: capacity },
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _b.sent();
                console.error('Stats error:', error_1);
                res.status(500).json({ error: 'Failed to fetch stats' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get transactions with search
router.get('/transactions', auth_1.authenticate, auth_1.requireAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var q, queryText, params, result, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                q = req.query.q;
                queryText = "\n      SELECT t.id, t.reference, t.customer_name, t.customer_phone, t.pass_type, \n             t.amount, t.status, t.created_at, tk.status as ticket_status, tk.ticket_code\n      FROM transactions t\n      LEFT JOIN tickets tk ON t.id = tk.transaction_id\n    ";
                params = [];
                if (q && typeof q === 'string') {
                    queryText += " WHERE t.customer_name ILIKE $1 OR t.customer_phone ILIKE $1 OR t.reference ILIKE $1";
                    params.push("%".concat(q, "%"));
                }
                queryText += " ORDER BY t.created_at DESC LIMIT 200";
                return [4 /*yield*/, (0, db_1.query)(queryText, params)];
            case 1:
                result = _a.sent();
                res.json({ transactions: result.rows });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error('Transactions error:', error_2);
                res.status(500).json({ error: 'Failed to fetch transactions' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Export transactions as CSV
router.get('/export', auth_1.authenticate, auth_1.requireAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var result, header, rows, csv, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, db_1.query)("SELECT t.reference, t.customer_name, t.customer_phone, t.pass_type, \n              t.amount, t.status, tk.status as ticket_status, t.created_at\n       FROM transactions t\n       LEFT JOIN tickets tk ON t.id = tk.transaction_id\n       ORDER BY t.created_at DESC")];
            case 1:
                result = _a.sent();
                header = ['Reference', 'Customer', 'Phone', 'Pass Type', 'Amount (XAF)', 'Payment Status', 'Ticket Status', 'Created At'];
                rows = result.rows.map(function (row) { return [
                    row.reference,
                    row.customer_name,
                    row.customer_phone,
                    row.pass_type,
                    String(row.amount),
                    row.status,
                    row.ticket_status || '—',
                    row.created_at.toISOString(),
                ]; });
                csv = __spreadArray([header.join(',')], rows.map(function (r) { return r.join(','); }), true).join('\n');
                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Content-Disposition', "attachment; filename=\"blcc-ledger-".concat(new Date().toISOString().slice(0, 10), ".csv\""));
                res.send(csv);
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error('Export error:', error_3);
                res.status(500).json({ error: 'Export failed' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get bouncers
router.get('/bouncers', auth_1.authenticate, auth_1.requireAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var result, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, db_1.query)("SELECT id, name, created_at FROM bouncers ORDER BY created_at DESC")];
            case 1:
                result = _a.sent();
                res.json({ bouncers: result.rows });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                console.error('Bouncers error:', error_4);
                res.status(500).json({ error: 'Failed to fetch bouncers' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Create bouncer
router.post('/bouncers', auth_1.authenticate, auth_1.requireAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, name_1, pin, accessPin, result, error_5;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.body, name_1 = _a.name, pin = _a.pin;
                if (!name_1 || !pin) {
                    return [2 /*return*/, res.status(400).json({ error: 'Name and PIN required' })];
                }
                if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
                    return [2 /*return*/, res.status(400).json({ error: 'PIN must be 4 digits' })];
                }
                return [4 /*yield*/, bcryptjs_1.default.hash(pin, 10)];
            case 1:
                accessPin = _b.sent();
                return [4 /*yield*/, (0, db_1.query)("INSERT INTO bouncers (name, access_pin) VALUES ($1, $2) RETURNING id, name, created_at", [name_1, accessPin])];
            case 2:
                result = _b.sent();
                res.json({ ok: true, bouncer: result.rows[0] });
                return [3 /*break*/, 4];
            case 3:
                error_5 = _b.sent();
                console.error('Create bouncer error:', error_5);
                res.status(500).json({ error: 'Failed to create bouncer' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Delete bouncer
router.delete('/bouncers', auth_1.authenticate, auth_1.requireAdmin, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.body.id;
                if (!id) {
                    return [2 /*return*/, res.status(400).json({ error: 'Bouncer ID required' })];
                }
                return [4 /*yield*/, (0, db_1.query)("DELETE FROM bouncers WHERE id = $1", [id])];
            case 1:
                _a.sent();
                res.json({ ok: true });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _a.sent();
                console.error('Delete bouncer error:', error_6);
                res.status(500).json({ error: 'Failed to delete bouncer' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
