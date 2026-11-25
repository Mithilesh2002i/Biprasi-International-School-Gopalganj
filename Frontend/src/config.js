export const DEFAULT_SCHOOL_NAME = 'Biprasi International School'; // Admin > Settings se bhi badal sakte hain
export const CLASS_LIST = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const DEMO_MODE = import.meta.env.VITE_DEMO !== 'false';
export const DEMO_OTP = '123456'; // real backend mein OTP SMS/email se aayega
export const ROUTER_MODE = ['hash', 'memory'].includes(import.meta.env.VITE_ROUTER) ? import.meta.env.VITE_ROUTER : 'browser';
export const API_URL = import.meta.env.VITE_API_URL || '';