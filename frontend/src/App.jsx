import React, { useState } from 'react';
import Navbar from './Components/Navbar/navbar.jsx';
import Home from './Components/Home';
import About from './Components/About';
import Videos from './Components/Videos';
import Contact from './Components/Contact';

const App = () => {
    const [theme, setTheme] = useState('light');

    return (
        <div className={`container ${theme}`}>
            <Navbar theme={theme} setTheme={setTheme} />
            <section id="home"><Home /></section>
            <section id="about"><About /></section>
            <section id="videos"><Videos /></section>
            <section id="contact"><Contact /></section>
        </div>
    );
};

export default App;