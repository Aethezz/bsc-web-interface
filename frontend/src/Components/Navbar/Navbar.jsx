import React from 'react';
import './Navbar.css';
import logo from '../../assets/logo.png';
import toggle_light from '../../assets/night.png';
import toggle_dark from '../../assets/day.png';

const Navbar = ({ theme, setTheme }) => {
    const toggleTheme = () => {
        theme === 'light' ? setTheme('dark') : setTheme('light');
    };

    const scrollToSection = (id) => {
        document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className='navbar'>
            <img src={logo} alt='' className='logo' />

            <ul>
                <li className="nav-item" onClick={() => scrollToSection('home')}>Home</li>
                <li className="nav-item" onClick={() => scrollToSection('about')}>About</li>
                <li className="nav-item" onClick={() => scrollToSection('videos')}>Videos</li>
                <li className="nav-item" onClick={() => scrollToSection('contact')}>Contact</li>
            </ul>

            <div className='toggle-icon-container' onClick={toggleTheme}>
                <img src={theme === "light" ? toggle_light : toggle_dark} alt='' className='toggle-icon' />
            </div>
    
        </div>
    );
};

export default Navbar;