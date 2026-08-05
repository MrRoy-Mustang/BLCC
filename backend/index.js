"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var cors_1 = require("cors");
var dotenv_1 = require("dotenv");
dotenv_1.default.config();
var app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.APP_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
var payments_1 = require("./routes/payments");
var tickets_1 = require("./routes/tickets");
var admin_1 = require("./routes/admin");
var auth_1 = require("./routes/auth");
app.use('/api/payments', payments_1.default);
app.use('/api/tickets', tickets_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/auth', auth_1.default);
// Health check
app.get('/api/health', function (req, res) {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// 404 handler
app.use(function (req, res) {
    res.status(404).json({ error: 'Not found' });
});
// Error handler
app.use(function (err, req, res, next) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
var PORT = process.env.PORT || 3001;
app.listen(PORT, function () {
    console.log("Backend server running on port ".concat(PORT));
});
exports.default = app;
