'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) return;

        // Set cookie
        document.cookie = `dev_password=${password}; path=/; max-age=2592000`; // 30 days

        // Attempt navigation
        router.refresh();
        router.push('/');
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in-up">
            <div className="w-full max-w-sm glass-panel p-8 rounded-3xl text-center">
                <h1 className="text-2xl font-bold mb-2">Restricted Access</h1>
                <p className="text-slate-400 text-sm mb-6">Please enter the developer password to access MovieBox.</p>

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full bg-slate-800/50 border border-slate-600 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all text-center"
                    />
                    {error && <p className="text-red-400 text-xs">{error}</p>}
                    <button
                        type="submit"
                        className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl py-3 transition-colors"
                    >
                        Enter
                    </button>
                </form>
            </div>
        </div>
    );
}
