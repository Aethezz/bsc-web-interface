import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import logo from '../../assets/logo.png';
import toggle_light from '../../assets/night.png';
import toggle_dark from '../../assets/day.png';

const Navbar = ({ theme, setTheme }) => {
    const toggleTheme = () => {
        theme === 'light' ? setTheme('dark') : setTheme('light');
    };

    return (
        <div className='navbar'>
            <Link to="/home">
                <img src={logo} alt='Logo' className='logo' />
            </Link>

            <ul>
                <li className="nav-item">
                    <Link to="/home">Home</Link>
                </li>
                <li className="nav-item">
                    <Link to="/about">About</Link>
                </li>
                <li className="nav-item">
                    <Link to="/videos">Videos</Link>
                </li>
                {/*
                <li className="nav-item">
                    <Link to="/contact">Contact</Link>
                </li>
                */}
            </ul>

            <div className="toggle-icon-container" onClick={toggleTheme}>
                <img src={theme === "light" ? toggle_light : toggle_dark} alt='Toggle Theme' className='toggle-icon' />
            </div>
        </div>
    );
};

export default Navbar;