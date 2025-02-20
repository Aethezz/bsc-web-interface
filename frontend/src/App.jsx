import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './Components/Navbar/navbar.jsx';
import Home from './Components/Home/Home.jsx';
import About from './Components/About/About.jsx';
import Videos from './Components/Videos/Videos.jsx';
import Contact from './Components/Contact/Contact.jsx';
import Footer from './Components/Footer/Footer.jsx';
import Anger from "./Components/Emotions/Anger";  // Import each emotion page
import Happy from "./Components/Emotions/Happy"; // Example, repeat for all
import Sad from "./Components/Emotions/Sad";
import Fear from "./Components/Emotions/Fear";

const App = () => {
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            setTheme(savedTheme);
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    return (
        <Router>
            <div className={`container ${theme}`}>
                <Navbar theme={theme} setTheme={toggleTheme} />
                <div className="main-content">
                    <Routes>
                        <Route path="/" element={<Home theme={theme} />} />
                        <Route path="/home" element={<Home theme={theme} />} />
                        <Route path="/about" element={<About theme={theme} />} />
                        <Route path="/videos" element={<Videos theme={theme} />} />
                        <Route path="/contact" element={<Contact theme={theme} />} />
                        <Route path="/emotions/anger" element={<Anger />} />
                        <Route path="/emotions/happy" element={<Happy />} />
                        <Route path="/emotions/sad" element={<Sad />} />
                        <Route path="/emotions/fear" element={<Fear />} />
                    </Routes>
                </div>
                <Footer theme={theme} />
            </div>
        </Router>
    );
};

export default App;