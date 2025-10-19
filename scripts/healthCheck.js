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
var supabase_js_1 = require("@supabase/supabase-js");
var dwolla_v2_1 = require("dwolla-v2");
var plaid_1 = require("plaid");
// Supabase
var supabase = (0, supabase_js_1.createClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
// Plaid
var plaidConfig = new plaid_1.Configuration({
    basePath: 'https://sandbox.plaid.com',
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
            'PLAID-SECRET': process.env.PLAID_SECRET,
        },
    },
});
var plaidClient = new plaid_1.PlaidApi(plaidConfig);
// Dwolla
var dwollaClient = new dwolla_v2_1.Client({
    key: process.env.DWOLLA_KEY,
    secret: process.env.DWOLLA_SECRET,
    environment: process.env.DWOLLA_ENV === 'production' ? 'production' : 'sandbox',
});
function healthCheck() {
    return __awaiter(this, void 0, void 0, function () {
        var error, err_1, response, err_2, res, err_3;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase.from('users').select('*').limit(1)];
                case 1:
                    error = (_b.sent()).error;
                    if (!error) {
                        console.log('Supabase: Connected');
                    }
                    else {
                        console.error('Supabase: Connection failed', error);
                    }
                    return [3 /*break*/, 3];
                case 2:
                    err_1 = _b.sent();
                    console.error('Supabase: Error', err_1);
                    return [3 /*break*/, 3];
                case 3:
                    _b.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, plaidClient.accountsBalanceGet({
                            access_token: 'invalid_token_for_test',
                        })];
                case 4:
                    response = _b.sent();
                    if (response.status === 200 || response.status === 400) {
                        console.log('Plaid: Connected');
                    }
                    return [3 /*break*/, 6];
                case 5:
                    err_2 = _b.sent();
                    if (typeof err_2 === 'object' &&
                        err_2 !== null &&
                        'response' in err_2 &&
                        typeof ((_a = err_2.response) === null || _a === void 0 ? void 0 : _a.status) === 'number' &&
                        (err_2.response.status === 400 || err_2.response.status === 401)) {
                        console.log('Plaid: Connected');
                    }
                    else {
                        console.error('Plaid: Connection failed', err_2);
                    }
                    return [3 /*break*/, 6];
                case 6:
                    _b.trys.push([6, 8, , 9]);
                    return [4 /*yield*/, dwollaClient.get('customers')];
                case 7:
                    res = _b.sent();
                    if (res.status === 200) {
                        console.log('Dwolla: Connected');
                    }
                    return [3 /*break*/, 9];
                case 8:
                    err_3 = _b.sent();
                    if (typeof err_3 === 'object' &&
                        err_3 !== null &&
                        'status' in err_3 &&
                        typeof err_3.status === 'number' &&
                        (err_3.status === 401 || err_3.status === 403)) {
                        console.log('Dwolla: Connected (auth error, but API reachable)');
                    }
                    else {
                        console.error('Dwolla: Connection failed', err_3);
                    }
                    return [3 /*break*/, 9];
                case 9: return [2 /*return*/];
            }
        });
    });
}
healthCheck();
