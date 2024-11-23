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
                <li onClick={() => scrollToSection('home')}>Home</li>
                <li onClick={() => scrollToSection('about')}>About</li>
                <li onClick={() => scrollToSection('videos')}>Videos</li>
                <li onClick={() => scrollToSection('contact')}>Contact</li>
            </ul>

            <img onClick={toggleTheme} src={theme === "light" ? toggle_light : toggle_dark} alt='' className='toggle-icon' />
        </div>
    );
};

export default Navbar;