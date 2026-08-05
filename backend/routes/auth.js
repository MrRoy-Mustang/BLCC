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
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var db_1 = require("../utils/db");
var bcryptjs_1 = require("bcryptjs");
var jsonwebtoken_1 = require("jsonwebtoken");
var router = (0, express_1.Router)();
// Bouncer login
router.post('/bouncer/login', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, name_1, pin, result, bouncer, isValid, JWT_SECRET, token, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.body, name_1 = _a.name, pin = _a.pin;
                if (!name_1 || !pin) {
                    return [2 /*return*/, res.status(400).json({ error: 'Name and PIN required' })];
                }
                return [4 /*yield*/, (0, db_1.query)("SELECT id, name, access_pin FROM bouncers WHERE name = $1", [name_1])];
            case 1:
                result = _b.sent();
                if (result.rows.length === 0) {
                    return [2 /*return*/, res.status(401).json({ error: 'Invalid credentials' })];
                }
                bouncer = result.rows[0];
                return [4 /*yield*/, bcryptjs_1.default.compare(pin, bouncer.access_pin)];
            case 2:
                isValid = _b.sent();
                if (!isValid) {
                    return [2 /*return*/, res.status(401).json({ error: 'Invalid credentials' })];
                }
                JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
                token = jsonwebtoken_1.default.sign({ role: 'bouncer', id: bouncer.id, name: bouncer.name }, JWT_SECRET, { expiresIn: '8h' });
                res.json({ token: token, role: 'bouncer', name: bouncer.name });
                return [3 /*break*/, 4];
            case 3:
                error_1 = _b.sent();
                console.error('Bouncer login error:', error_1);
                res.status(500).json({ error: 'Login failed' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Logout (client-side only, just for completeness)
router.post('/logout', function (req, res) {
    res.json({ ok: true });
});
exports.default = router;
