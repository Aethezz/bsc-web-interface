import React from 'react';
import './About.css';

const About = ({ theme }) => {
  return (
    <div className={`about-container ${theme}`}>
      {/* Team Section */}
     {/*
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
      */}

      {/* Project Section */}
      <section className="project-section slide-up">
        <h2 className="section-title">About Our Project</h2>
        <div className="project-content">
          <p>
          Brain Stimuli is a collaborative AI-driven research initiative 
          led by a passionate group of second-year university students, 
          guided by the expertise of UofT professor Dr. Fa-Hsuan Lin. 
          Our mission is to explore the intersection of artificial intelligence 
          and neuroscience by developing a model that can analyze and interpret 
          human emotions from brief video clips. This work aims to shed light 
          on the complexities of brain function and contribute to advancing 
          neurological research.
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