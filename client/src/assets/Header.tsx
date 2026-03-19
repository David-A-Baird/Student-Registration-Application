import React from 'react';

function Header() {
    return (
        <header className="site-header">
            <div className="brand">
                <svg className="brand-logo" width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <defs>
                        <linearGradient id="g1" x1="0%" x2="100%" y1="0%" y2="100%">
                            <stop offset="0%" stopColor="#6b63d6" />
                            <stop offset="100%" stopColor="#95a8ff" />
                        </linearGradient>
                    </defs>
                    <rect width="100" height="100" rx="18" fill="url(#g1)" />
                    <text x="50" y="60" textAnchor="middle" fontSize="48" fontFamily="Arial, Helvetica, sans-serif" fill="#fff">YC</text>
                </svg>
                <div>
                    <div className="brand-title">Yeet College</div>
                    <div className="brand-sub">Student Registration</div>
                </div>
            </div>
        </header>
    );
}

export default Header;