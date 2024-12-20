import React from 'react';
import './About.css';

const About = ({ theme }) => {
  return (
    <div className={`about-container ${theme}`}>
      {/* Team Section */}
      <section className="team-section">
        <h2 className="section-title">Our Team</h2>
        <div className="team-grid">
          {[
            { name: 'Vikram', role: 'Backend/Frontend', img: '/api/placeholder/150/150' },
            { name: 'Justin', role: 'CTO', img: '/api/placeholder/150/150' },
            { name: 'Dr. Fa-Hsuan Lin', role: 'PHD. Reaseacher', img: '/api/placeholder/150/150' }
          ].map((member, index) => (
            <div key={index} className="team-card fade-in">
              <div className="image-container">
                <img 
                  src={member.img} 
                  alt={member.name} 
                  className="team-image"
                />
              </div>
              <h3 className="member-name">{member.name}</h3>
              <p className="member-role">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Project Section */}
      <section className="project-section slide-up">
        <h2 className="section-title">About Our Project</h2>
        <div className="project-content">
          <p>
            Our project aims to revolutionize the way we understand and interact with 
            AI-powered emotional analysis. We are dedicated to providing cutting-edge 
            solutions that help businesses and individuals gain insights into human 
            emotions through advanced AI technology.
          </p>
        </div>
      </section>

      {/* Research Section */}
      <section className="research-section fade-in">
        <h2 className="section-title">Research Papers</h2>
        <div className="research-grid">
          {[
            { title: 'Research Paper 1', link: '#' },
            { title: 'Research Paper 2', link: '#' }
          ].map((paper, index) => (
            <div key={index} className="paper-card">
              <a href={paper.link} className="paper-link">
                {paper.title}
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default About;