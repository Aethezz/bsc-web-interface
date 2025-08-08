import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './Components/Navbar/Navbar.jsx';
import Home from './Components/Home/Home.jsx';
import About from './Components/About/About.jsx';
import Videos from './Components/Videos/Videos.jsx';
import Contact from './Components/Contact/Contact.jsx';
import Contribute from './Components/Contribute/Contribute.jsx';
import Footer from './Components/Footer/footer.jsx';
import Happy from "./Components/Emotions/Happy"; // Example, repeat for all
import Sad from "./Components/Emotions/Sad";
import Fear from "./Components/Emotions/Fear";
import Funny from "./Components/Emotions/Funny"; // New ML emotion
import Neutral from "./Components/Emotions/Neutral"; // New ML emotion

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
                        <Route path="/contribute" element={<Contribute theme={theme} />} />
                        <Route path="/emotions/Neutral" element={<Neutral />} />
                        <Route path="/emotions/Happy" element={<Happy />} />
                        <Route path="/emotions/Funny" element={<Funny />} />
                        <Route path="/emotions/Fear" element={<Fear />} />
                        <Route path="/emotions/Sad" element={<Sad />} />

                        {/* Legacy routes for old emotion names */}
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
