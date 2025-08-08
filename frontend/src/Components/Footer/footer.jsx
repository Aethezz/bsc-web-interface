import React from 'react';
import './footer.css';
import { FaGithub } from 'react-icons/fa';

const Footer = ({ theme }) => {
  return (
    <footer className={`footer ${theme}`}>
      <div className="footer-content">
        <div className="footer-section">
          <h2>Contact Us</h2>
          <p>Email: StimuliCuration@gmail.com</p>
          <p>Phone: +1 (289) 400 3750</p>
        </div>
        <div className="footer-section">
          <h2>Follow Us</h2>
          <a href="https://github.com/your-github-profile" target="_blank" rel="noopener noreferrer">
            <FaGithub className="footer-icon" />
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Brain Stimuli. All rights reserved.</p>
        <p>Made with <span className="heart">&lt;3</span> by realjs</p>
      </div>
    </footer>
  );
};

export default Footer;
