import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export default function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configure axios defaults
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/teachers/login`, {
        email,
        password,
      });

      const { access_token, teacher: teacherData } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('teacher', JSON.stringify(teacherData));
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      setIsAuthenticated(true);
      setTeacher(teacherData);
      
      toast.success('Login successful!');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.detail || 'Login failed');
      return false;
    }
  };

  const register = async (name, email, password, schoolName) => {
    try {
      const response = await axios.post(`${API_URL}/api/teachers/register`, {
        name,
        email,
        password,
        school_name: schoolName,
      });

      toast.success(`Registration successful! Your hash key is: ${response.data.hash_key}`);
      toast.success('Please save this hash key and share it with your students.');
      
      return response.data.hash_key;
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.detail || 'Registration failed');
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('teacher');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setTeacher(null);
    toast.success('Logged out successfully');
  };

  const value = {
    isAuthenticated,
    teacher,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
