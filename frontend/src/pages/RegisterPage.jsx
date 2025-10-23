import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaGithub, FaGoogle } from 'react-icons/fa';
import axios from 'axios';

const RegisterPage = () => {
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fullName = e.target.fullName.value;
        const email = e.target.email.value;
        const password = e.target.password.value;
        const password2 = e.target.password2.value;

        if (password !== password2) {
            alert('Passwords do not match!');
            return;
        }
        
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');

        try {
            await axios.post('http://localhost:8000/api/register/', {
                email: email,
                password: password,
                first_name: firstName,
                last_name: lastName || ""
            });
            navigate('/login');
        } catch (error) {
            console.error('Registration failed!', error);
            alert('Registration failed. This email may already be taken.');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-white p-4 font-sans bg-[var(--dark-bg)]">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link to="/" className="text-sm text-gray-400 hover:text-white transition">← Back to Home</Link>
                </div>
                <div className="bg-[var(--dark-card)] p-8 rounded-2xl shadow-lg border border-gray-800">
                    <h1 className="text-3xl font-bold text-center mb-2">Create account</h1>
                    <p className="text-center text-gray-400 mb-6">Get started with CodeLive today</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <a href="http://localhost:8000/accounts/github/login/" className="flex items-center justify-center py-3 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition">
                            <FaGithub className="mr-2" /> GitHub
                        </a>
                        <a href="http://localhost:8000/accounts/google/login/" className="flex items-center justify-center py-3 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition">
                            <FaGoogle className="mr-2" /> Google
                        </a>
                    </div>

                    <div className="flex items-center my-4">
                        <hr className="flex-grow border-gray-700" />
                        <span className="mx-4 text-xs text-gray-400">OR CREATE ACCOUNT WITH EMAIL</span>
                        <hr className="flex-grow border-gray-700" />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Full Name</label>
                            <input type="text" name="fullName" placeholder="Enter your full name" className="w-full px-4 py-3 mt-1 text-white bg-[var(--dark-card)] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-purple)]" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Email</label>
                            <input type="email" name="email" placeholder="Enter your email" className="w-full px-4 py-3 mt-1 text-white bg-[var(--dark-card)] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-purple)]" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Password</label>
                            <input type="password" name="password" placeholder="Create a password" className="w-full px-4 py-3 mt-1 text-white bg-[var(--dark-card)] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-purple)]" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Confirm Password</label>
                            <input type="password" name="password2" placeholder="Confirm your password" className="w-full px-4 py-3 mt-1 text-white bg-[var(--dark-card)] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-purple)]" required />
                        </div>
                        <button type="submit" className="w-full py-3 font-bold text-white bg-[var(--primary-purple)] rounded-lg hover:brightness-110 transition duration-200">
                            Create Account
                        </button>
                    </form>

                    <p className="text-sm text-center text-gray-400 mt-6">
                        Already have an account? <Link to="/login" className="font-medium text-[var(--accent-lavender)] hover:underline">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;