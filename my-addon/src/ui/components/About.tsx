import React from 'react';
import { Info, Heart, ExternalLink, Github, Mail, BookOpen } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const About: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div style={{ padding: 'var(--spectrum-spacing-400)', fontFamily: 'adobe-clean, sans-serif' }}>
      <h2 className="spectrum-heading-xl">
        {t('aboutTitle')}
      </h2>
      <p className="spectrum-body-s" style={{ marginBottom: 'var(--spectrum-spacing-500)' }}>
        {t('aboutSubtitle')}
      </p>

      {/* App Info Section */}
      <div style={{
        padding: 'var(--spectrum-spacing-400)',
        backgroundColor: 'var(--spectrum-background-layer-2)',
        borderRadius: 'var(--spectrum-corner-radius-200)',
        border: '2px solid #FA0',
        marginBottom: 'var(--spectrum-spacing-400)',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '64px',
          marginBottom: 'var(--spectrum-spacing-200)'
        }}>
          🎨
        </div>
        <h3 className="spectrum-heading-l" style={{ margin: '0 0 var(--spectrum-spacing-100) 0' }}>
          Pixel Pluck v1.0.0
        </h3>
        <p style={{
          margin: 0,
          fontSize: 'var(--spectrum-body-text-size)',
          color: 'var(--spectrum-gray-700)',
          lineHeight: 1.6
        }}>
          {t('appTagline')}
        </p>
      </div>

      {/* Features Section */}
      <div style={{ marginBottom: 'var(--spectrum-spacing-500)' }}>
        <h3 className="spectrum-heading-l" style={{ 
          margin: '0 0 var(--spectrum-spacing-200) 0',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spectrum-spacing-100)'
        }}>
          <Info size={20} color="#00719f" />
          Features
        </h3>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spectrum-spacing-300)'
        }}>
          <div style={{
            padding: 'var(--spectrum-spacing-300)',
            backgroundColor: 'var(--spectrum-background-layer-2)',
            borderRadius: 'var(--spectrum-corner-radius-100)',
            border: '1px solid var(--spectrum-border-color)',
          }}>
            <div style={{
              fontSize: 'var(--spectrum-body-text-size)',
              fontWeight: 600,
              color: 'var(--spectrum-body-color)',
              marginBottom: '8px'
            }}>
              🧠 Brand Brain
            </div>
            <p style={{
              margin: 0,
              fontSize: 'var(--spectrum-body-s-text-size)',
              color: 'var(--spectrum-gray-700)',
              lineHeight: 1.5
            }}>
              Extract brand colors, fonts, and voice from any website using AI
            </p>
          </div>

          <div style={{
            padding: 'var(--spectrum-spacing-300)',
            backgroundColor: 'var(--spectrum-background-layer-2)',
            borderRadius: 'var(--spectrum-corner-radius-100)',
            border: '1px solid var(--spectrum-border-color)',
          }}>
            <div style={{
              fontSize: 'var(--spectrum-body-text-size)',
              fontWeight: 600,
              color: 'var(--spectrum-body-color)',
              marginBottom: '8px'
            }}>
              📈 Trend Engine
            </div>
            <p style={{
              margin: 0,
              fontSize: 'var(--spectrum-body-s-text-size)',
              color: 'var(--spectrum-gray-700)',
              lineHeight: 1.5
            }}>
              Discover current design trends and generate AI-powered visuals
            </p>
          </div>

          <div style={{
            padding: 'var(--spectrum-spacing-300)',
            backgroundColor: 'var(--spectrum-background-layer-2)',
            borderRadius: 'var(--spectrum-corner-radius-100)',
            border: '1px solid var(--spectrum-border-color)',
          }}>
            <div style={{
              fontSize: 'var(--spectrum-body-text-size)',
              fontWeight: 600,
              color: 'var(--spectrum-body-color)',
              marginBottom: '8px'
            }}>
              🔍 Design Auditor
            </div>
            <p style={{
              margin: 0,
              fontSize: 'var(--spectrum-body-s-text-size)',
              color: 'var(--spectrum-gray-700)',
              lineHeight: 1.5
            }}>
              Analyze your designs for brand consistency and accessibility
            </p>
          </div>
        </div>
      </div>

      {/* Technology Stack */}
      <div style={{ marginBottom: 'var(--spectrum-spacing-500)' }}>
        <h3 className="spectrum-heading-l" style={{ 
          margin: '0 0 var(--spectrum-spacing-200) 0',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spectrum-spacing-100)'
        }}>
          <BookOpen size={20} color="#00719f" />
          Powered By
        </h3>
        
        <div style={{
          padding: 'var(--spectrum-spacing-300)',
          backgroundColor: 'var(--spectrum-background-layer-2)',
          borderRadius: 'var(--spectrum-corner-radius-100)',
          border: '1px solid var(--spectrum-border-color)',
        }}>
          <ul style={{
            margin: 0,
            paddingLeft: 'var(--spectrum-spacing-400)',
            fontSize: 'var(--spectrum-body-text-size)',
            color: 'var(--spectrum-body-color)',
            lineHeight: 1.8
          }}>
            <li>Adobe Express Add-on SDK</li>
            <li>Groq AI (Llama 3.3 70B)</li>
            <li>Adobe Spectrum Design System</li>
            <li>React & TypeScript</li>
          </ul>
        </div>
      </div>

      {/* Links Section */}
      <div style={{ marginBottom: 'var(--spectrum-spacing-400)' }}>
        <h3 className="spectrum-heading-l" style={{ 
          margin: '0 0 var(--spectrum-spacing-200) 0',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spectrum-spacing-100)'
        }}>
          <ExternalLink size={20} color="#00719f" />
          Resources
        </h3>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spectrum-spacing-200)'
        }}>
          <a
            href="#"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spectrum-spacing-200)',
              padding: 'var(--spectrum-spacing-200)',
              backgroundColor: 'var(--spectrum-background-layer-2)',
              borderRadius: 'var(--spectrum-corner-radius-100)',
              border: '1px solid var(--spectrum-border-color)',
              color: '#00719f',
              textDecoration: 'none',
              fontSize: 'var(--spectrum-body-text-size)',
              fontWeight: 500,
              transition: 'background-color 0.13s ease-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--spectrum-gray-200)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--spectrum-background-layer-2)';
            }}
          >
            <BookOpen size={18} />
            Documentation
          </a>

          <a
            href="#"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spectrum-spacing-200)',
              padding: 'var(--spectrum-spacing-200)',
              backgroundColor: 'var(--spectrum-background-layer-2)',
              borderRadius: 'var(--spectrum-corner-radius-100)',
              border: '1px solid var(--spectrum-border-color)',
              color: '#00719f',
              textDecoration: 'none',
              fontSize: 'var(--spectrum-body-text-size)',
              fontWeight: 500,
              transition: 'background-color 0.13s ease-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--spectrum-gray-200)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--spectrum-background-layer-2)';
            }}
          >
            <Github size={18} />
            View on GitHub
          </a>

          <a
            href="#"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spectrum-spacing-200)',
              padding: 'var(--spectrum-spacing-200)',
              backgroundColor: 'var(--spectrum-background-layer-2)',
              borderRadius: 'var(--spectrum-corner-radius-100)',
              border: '1px solid var(--spectrum-border-color)',
              color: '#00719f',
              textDecoration: 'none',
              fontSize: 'var(--spectrum-body-text-size)',
              fontWeight: 500,
              transition: 'background-color 0.13s ease-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--spectrum-gray-200)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--spectrum-background-layer-2)';
            }}
          >
            <Mail size={18} />
            Contact Support
          </a>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: 'var(--spectrum-spacing-300)',
        textAlign: 'center',
        borderTop: '1px solid var(--spectrum-border-color)',
        paddingTop: 'var(--spectrum-spacing-300)'
      }}>
        <p style={{
          margin: 0,
          fontSize: 'var(--spectrum-body-s-text-size)',
          color: 'var(--spectrum-gray-600)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          Made with <Heart size={14} color="#FA0" fill="#FA0" /> for Adobe Express
        </p>
      </div>
    </div>
  );
};

export default About;
