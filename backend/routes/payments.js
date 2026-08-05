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
var notchpay_1 = require("../utils/notchpay");
var crypto_1 = require("crypto");
var router = (0, express_1.Router)();
// Generate transaction reference
function generateReference() {
    return "BLCC-TX-".concat(crypto_1.default.randomBytes(6).toString('hex').toUpperCase());
}
// Generate ticket code
function generateTicketCode() {
    var digits = Array.from(crypto_1.default.randomBytes(3), function (b) { return (b % 10).toString(); }).join('');
    return "TKT-BLCC-".concat(digits);
}
// Generate QR hash
function generateQrHash(ticketCode) {
    var secret = process.env.QR_SECRET || 'your-qr-secret-change-in-production';
    var nonce = crypto_1.default.randomBytes(12).toString('hex');
    var payload = "".concat(ticketCode, ".").concat(nonce);
    var signature = crypto_1.default.createHmac('sha256', secret).update(payload).digest('hex');
    return "".concat(payload, ".").concat(signature);
}
// Pricing
var PRICES = {
    STANDARD: 3000,
    REGULAR_VIP: 8000,
    CARRE_BRONZE: 50000,
    CARRE_OR: 150000,
    CARRE_DIAMANT: 250000,
};
// Initialize payment
router.post('/initialize', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, customerName, customerPhone, passType, validPassTypes, amount, reference, customerEmail, notchResponse, error_1;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 7, , 8]);
                _a = req.body, customerName = _a.customerName, customerPhone = _a.customerPhone, passType = _a.passType;
                if (!customerName || !customerPhone || !passType) {
                    return [2 /*return*/, res.status(400).json({ error: 'Missing required fields' })];
                }
                validPassTypes = ['STANDARD', 'REGULAR_VIP', 'CARRE_BRONZE', 'CARRE_OR', 'CARRE_DIAMANT'];
                if (!validPassTypes.includes(passType)) {
                    return [2 /*return*/, res.status(400).json({ error: 'Invalid pass type' })];
                }
                amount = PRICES[passType];
                reference = generateReference();
                customerEmail = "".concat(customerPhone.replace(/[^0-9]/g, ''), "@blcc.local");
                // Create transaction record
                return [4 /*yield*/, (0, db_1.query)("INSERT INTO transactions (reference, customer_name, customer_phone, pass_type, amount, status)\n       VALUES ($1, $2, $3, $4, $5, 'PENDING')", [reference, customerName, customerPhone, passType, amount])];
            case 1:
                // Create transaction record
                _c.sent();
                return [4 /*yield*/, (0, notchpay_1.initializePayment)({
                        amount: amount,
                        currency: 'XAF',
                        reference: reference,
                        customerName: customerName,
                        customerPhone: customerPhone,
                        customerEmail: customerEmail,
                        description: "BLCC Ticket - ".concat(passType),
                    })];
            case 2:
                notchResponse = _c.sent();
                if (!!notchResponse.authorization_url) return [3 /*break*/, 4];
                return [4 /*yield*/, (0, db_1.query)("UPDATE transactions SET status = 'FAILED' WHERE reference = $1", [reference])];
            case 3:
                _c.sent();
                return [2 /*return*/, res.status(500).json({ error: 'Failed to initialize payment' })];
            case 4:
                if (!((_b = notchResponse.transaction) === null || _b === void 0 ? void 0 : _b.reference)) return [3 /*break*/, 6];
                return [4 /*yield*/, (0, db_1.query)("UPDATE transactions SET notchpay_trxref = $1 WHERE reference = $2", [notchResponse.transaction.reference, reference])];
            case 5:
                _c.sent();
                _c.label = 6;
            case 6:
                res.json({
                    reference: reference,
                    authorizationUrl: notchResponse.authorization_url,
                });
                return [3 /*break*/, 8];
            case 7:
                error_1 = _c.sent();
                console.error('Payment initialization error:', error_1);
                res.status(500).json({ error: 'Failed to initialize payment' });
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); });
// Callback from Notch Pay
router.get('/callback', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var ref;
    return __generator(this, function (_a) {
        ref = req.query.ref;
        if (!ref || typeof ref !== 'string') {
            return [2 /*return*/, res.status(400).send('Invalid reference')];
        }
        // Redirect to frontend with reference
        res.redirect("".concat(process.env.APP_URL || 'http://localhost:5173', "/payment-status?ref=").concat(ref));
        return [2 /*return*/];
    });
}); });
// Webhook from Notch Pay
router.post('/webhook', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var verifyWebhookSignature, rawBody, signature, _a, event_1, data, notchReference, result, transaction, ticketCode, qrHash, packageDetailsMap, packageDetails, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 8, , 9]);
                return [4 /*yield*/, Promise.resolve().then(function () { return require('../utils/notchpay'); })];
            case 1:
                verifyWebhookSignature = (_b.sent()).verifyWebhookSignature;
                rawBody = JSON.stringify(req.body);
                signature = req.headers['x-notch-signature'];
                if (!verifyWebhookSignature(rawBody, signature)) {
                    return [2 /*return*/, res.status(401).json({ error: 'Invalid signature' })];
                }
                _a = req.body, event_1 = _a.event, data = _a.data;
                notchReference = data === null || data === void 0 ? void 0 : data.reference;
                if (!notchReference) {
                    return [2 /*return*/, res.status(400).json({ error: 'Missing reference' })];
                }
                if (!(event_1 === 'payment.complete')) return [3 /*break*/, 5];
                return [4 /*yield*/, (0, db_1.query)("UPDATE transactions \n         SET status = 'PAID' \n         WHERE (notchpay_trxref = $1 OR reference = $1) AND status = 'PENDING'\n         RETURNING id, reference, customer_name, pass_type, amount", [notchReference])];
            case 2:
                result = _b.sent();
                if (!(result.rows.length === 1)) return [3 /*break*/, 4];
                transaction = result.rows[0];
                ticketCode = generateTicketCode();
                qrHash = generateQrHash(ticketCode);
                packageDetailsMap = {
                    STANDARD: 'Standard Entry',
                    REGULAR_VIP: 'VIP Bracelet — 3-Day Pass',
                    CARRE_BRONZE: 'PACK YANNICK NOAH BRONZE',
                    CARRE_OR: 'PACK YANNICK NOAH OR',
                    CARRE_DIAMANT: 'PACK YANNICK NOAH DIAMANT',
                };
                packageDetails = packageDetailsMap[transaction.pass_type] || 'Standard Entry';
                return [4 /*yield*/, (0, db_1.query)("INSERT INTO tickets (ticket_code, transaction_id, qr_hash, status, tier, price_fcfa, package_details)\n           VALUES ($1, $2, $3, 'ISSUED', $4, $5, $6)", [ticketCode, transaction.id, qrHash, transaction.pass_type, transaction.amount, packageDetails])];
            case 3:
                _b.sent();
                console.log('Ticket issued:', { ticketCode: ticketCode, reference: transaction.reference });
                _b.label = 4;
            case 4: return [3 /*break*/, 7];
            case 5:
                if (!(event_1 === 'payment.failed' || event_1 === 'payment.canceled')) return [3 /*break*/, 7];
                return [4 /*yield*/, (0, db_1.query)("UPDATE transactions \n         SET status = 'FAILED' \n         WHERE (notchpay_trxref = $1 OR reference = $1) AND status = 'PENDING'", [notchReference])];
            case 6:
                _b.sent();
                _b.label = 7;
            case 7:
                res.json({ received: true });
                return [3 /*break*/, 9];
            case 8:
                error_2 = _b.sent();
                console.error('Webhook error:', error_2);
                res.status(500).json({ error: 'Webhook processing failed' });
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); });
// Check transaction status
router.get('/status/:ref', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var ref, result, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                ref = req.params.ref;
                return [4 /*yield*/, (0, db_1.query)("SELECT t.status, tk.ticket_code \n       FROM transactions t\n       LEFT JOIN tickets tk ON t.id = tk.transaction_id\n       WHERE t.reference = $1", [ref])];
            case 1:
                result = _a.sent();
                if (result.rows.length === 0) {
                    return [2 /*return*/, res.status(404).json({ error: 'Transaction not found' })];
                }
                res.json({
                    status: result.rows[0].status,
                    ticketCode: result.rows[0].ticket_code,
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error('Status check error:', error_3);
                res.status(500).json({ error: 'Failed to check status' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
