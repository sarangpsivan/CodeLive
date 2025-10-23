import React, { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { FaGithub, FaGoogle } from 'react-icons/fa';

const LoginPage = () => {
    const { loginUser } = useContext(AuthContext);

    const handleSubmit = (e) => {
        e.preventDefault();
        const username = e.target.email.value;
        const password = e.target.password.value;
        loginUser(username, password);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-white p-4 font-sans bg-[var(--dark-bg)]"> 
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link to="/" className="text-sm text-gray-400 hover:text-white transition">← Back to Home</Link>
                </div>
                <div className="bg-[var(--dark-card)] p-8 rounded-2xl shadow-lg border border-gray-800">
                    <h1 className="text-3xl font-bold text-center mb-2">Welcome back</h1>
                    <p className="text-center text-gray-400 mb-8">Sign in to your CodeLive account</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Email</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                className="w-full px-4 py-3 mt-1 text-white bg-[var(--dark-card)] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-purple)]"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Password</label>
                            <input
                                type="password"
                                name="password"
                                placeholder="Enter your password"
                                className="w-full px-4 py-3 mt-1 text-white bg-[var(--dark-card)] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-purple)]"
                                required
                            />
                        </div>
                        <button type="submit" className="w-full py-3 font-bold text-white bg-[var(--primary-purple)] rounded-lg hover:brightness-110 transition duration-200">
                            Sign In
                        </button>
                    </form>

                    <div className="flex items-center my-6">
                        <hr className="flex-grow border-gray-700" />
                        <span className="mx-4 text-gray-400 text-sm">Or continue with</span>
                        <hr className="flex-grow border-gray-700" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <a href="http://localhost:8000/accounts/github/login/" className="flex items-center justify-center py-3 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition">
                            <FaGithub className="mr-2" /> GitHub
                        </a>
                        <a href="http://localhost:8000/accounts/google/login/" className="flex items-center justify-center py-3 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition">
                            <FaGoogle className="mr-2" /> Google
                        </a>
                    </div>

                    <p className="text-sm text-center text-gray-400 mt-8">
                        Don't have an account? <Link to="/register" className="font-medium text-[var(--accent-lavender)] hover:underline">Sign up</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;