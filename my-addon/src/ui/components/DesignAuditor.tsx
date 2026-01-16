import React, { useState } from 'react';
import { useBrand } from '../../context/BrandContext';
import { groqClient, VisionAnalysis } from '../../services/GroqClient';
import { Search, BarChart3, Lightbulb, Sparkles, Upload } from 'lucide-react';
import { ProgressCircle } from './LoadingComponents';
import addOnUISdk from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

const DesignAuditor: React.FC = () => {
  const { brandData, hasBrandData } = useBrand();
  const [auditing, setAuditing] = useState(false);
  const [analysis, setAnalysis] = useState<VisionAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAudit = async () => {
    if (!hasBrandData) {
      setError('Please extract brand data first in the Brand Brain tab!');
      return;
    }

    setAuditing(true);
    setAnalysis(null);
    setError(null);

    try {
      // Create rendition of current page
      const renditions = await addOnUISdk.app.document.createRenditions({
        range: addOnUISdk.constants.Range.currentPage,
        format: addOnUISdk.constants.RenditionFormat.png,
      });

      if (renditions.length === 0) {
        throw new Error('No rendition created');
      }

      const rendition = renditions[0];
      const blob = rendition.blob;

      // Convert blob to base64 (chunk processing to avoid stack overflow)
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Process in chunks to avoid "Maximum call stack size exceeded"
      let binaryString = '';
      const chunkSize = 8192; // Process 8KB at a time
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, i + chunkSize);
        binaryString += String.fromCharCode.apply(null, Array.from(chunk));
      }
      const base64 = btoa(binaryString);

      // Check if page has any content
      if (!base64 || base64.length < 100) {
        throw new Error('Page appears empty. Add some content before running design audit.');
      }

      // Analyze with Groq Vision
      const visionAnalysis = await groqClient.analyzeDesign(base64, brandData);
      
      // Validate analysis returned
      if (!visionAnalysis) {
        throw new Error('Design review service is currently unavailable. Please try again later.');
      }
      
      setAnalysis(visionAnalysis);
    } catch (error) {
      console.error('Error running audit:', error);
      
      // Provide specific error messages
      let errorMessage = 'Failed to run audit. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('unavailable') || error.message.includes('service')) {
          errorMessage = 'Design review service is temporarily unavailable. Please try again in a moment.';
        } else if (error.message.includes('empty')) {
          errorMessage = error.message;
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setAuditing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#4069FD'; // Primary Blue
    if (score >= 75) return '#00719f'; // Accent Teal
    if (score >= 60) return '#FA0'; // Yellow/Orange
    return '#5078FE'; // Light Blue
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Work';
  };

  const metrics = analysis
    ? [
        { label: 'Color Consistency', score: analysis.colorConsistency },
        { label: 'Typography Scale', score: analysis.typographyScale },
        { label: 'Spacing Rhythm', score: analysis.spacingRhythm },
        { label: 'Accessibility', score: analysis.accessibility },
      ]
    : [];

  return (
    <div style={{ padding: 'var(--spectrum-spacing-400)', fontFamily: 'adobe-clean, sans-serif' }}>

      {/* Error Display */}
      {error && (
        <div style={{
          padding: 'var(--spectrum-spacing-300)',
          backgroundColor: 'var(--spectrum-background-layer-2)',
          border: '1px solid var(--spectrum-negative-color)',
          borderRadius: 'var(--spectrum-corner-radius-100)',
          marginBottom: 'var(--spectrum-spacing-400)',
        }}>
          <p style={{ 
            margin: 0,
            fontSize: 'var(--spectrum-font-size-100)',
            color: 'var(--spectrum-negative-color)',
            fontWeight: 500
          }}>
            {error}
          </p>
        </div>
      )}

      {/* Brand Context Display */}
      {hasBrandData && (
        <div style={{
          padding: 'var(--spectrum-spacing-300)',
          backgroundColor: 'var(--spectrum-background-layer-2)',
          borderRadius: 'var(--spectrum-corner-radius-100)',
          border: '1px solid var(--spectrum-border-color)',
          marginBottom: 'var(--spectrum-spacing-400)'
        }}>
          <h3 className="spectrum-heading-m" style={{ 
            margin: '0 0 var(--spectrum-spacing-200) 0'
          }}>
            Auditing Against Your Brand:
          </h3>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(--spectrum-spacing-200)',
            flexWrap: 'wrap'
          }}>
            <span style={{ 
              fontSize: 'var(--spectrum-body-s-text-size)',
              color: 'var(--spectrum-body-color)',
              fontWeight: 600
            }}>
              Colors:
            </span>
            <div style={{ display: 'flex', gap: 'var(--spectrum-spacing-75)' }}>
              {brandData.primaryColors.slice(0, 5).map((color, index) => (
                <div
                  key={index}
                  title={color}
                  style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: color,
                    borderRadius: '4px',
                    border: '1px solid var(--spectrum-border-color)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Run Audit Button */}
      <button
        onClick={runAudit}
        disabled={!hasBrandData || auditing}
        style={{
          width: '100%',
          padding: 'var(--spectrum-spacing-300) var(--spectrum-spacing-400)',
          fontSize: 'var(--spectrum-font-size-200)',
          fontWeight: 700,
          fontFamily: 'adobe-clean, sans-serif',
          backgroundColor: auditing ? 'var(--spectrum-gray-400)' : '#4069FD',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--spectrum-corner-radius-100)',
          cursor: !hasBrandData || auditing ? 'not-allowed' : 'pointer',
          transition: 'all 0.13s ease-out',
          opacity: !hasBrandData || auditing ? 0.5 : 1,
          marginBottom: 'var(--spectrum-spacing-400)',
        }}
        onMouseEnter={(e) => {
          if (hasBrandData && !auditing) {
            e.currentTarget.style.backgroundColor = '#5078FE';
          }
        }}
        onMouseLeave={(e) => {
          if (hasBrandData && !auditing) {
            e.currentTarget.style.backgroundColor = '#4069FD';
          }
        }}
      >
        {auditing ? (
          <>Analyzing Design...</>
        ) : (
          <>
            <Search size={18} />
            Run Design Audit
          </>
        )}
      </button>

      {/* Loading State */}
      {auditing && (
        <div style={{ textAlign: 'center', padding: 'var(--spectrum-spacing-600)' }}>
          <ProgressCircle size="medium" label="Analyzing design..." />
        </div>
      )}

      {/* Analysis Results */}
      {!auditing && analysis && (
        <div style={{
          padding: 'var(--spectrum-spacing-400)',
          backgroundColor: 'var(--spectrum-background-layer-2)',
          borderRadius: 'var(--spectrum-corner-radius-200)',
          border: '2px solid #FA0',
        }}>
          {/* Overall Score */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: 'var(--spectrum-spacing-500)',
            padding: 'var(--spectrum-spacing-400)',
            backgroundColor: 'var(--spectrum-background-layer-1)',
            borderRadius: 'var(--spectrum-corner-radius-100)',
          }}>
            <div style={{ 
              fontSize: '64px', 
              fontWeight: 800, 
              color: getScoreColor(analysis.score),
              lineHeight: 1,
              marginBottom: 'var(--spectrum-spacing-100)'
            }}>
              {analysis.score}
            </div>
            <p style={{ 
              fontSize: 'var(--spectrum-body-l-text-size)',
              color: 'var(--spectrum-body-color)',
              fontWeight: 600,
              margin: '0 0 var(--spectrum-spacing-75) 0'
            }}>
              Overall Score
            </p>
            <span style={{
              display: 'inline-block',
              padding: 'var(--spectrum-spacing-75) var(--spectrum-spacing-300)',
              backgroundColor: getScoreColor(analysis.score),
              color: '#fff',
              borderRadius: 'var(--spectrum-corner-radius-100)',
              fontSize: 'var(--spectrum-body-s-text-size)',
              fontWeight: 700,
            }}>
              {getScoreLabel(analysis.score)}
            </span>
          </div>

          {/* Detailed Metrics */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 'var(--spectrum-spacing-300)',
            marginBottom: 'var(--spectrum-spacing-400)'
          }}>
            <h3 className="spectrum-heading-l" style={{ 
              margin: '0 0 var(--spectrum-spacing-200) 0',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spectrum-spacing-100)'
            }}>
              <BarChart3 size={20} color="#00719f" />
              Detailed Metrics
            </h3>
            {metrics.map((metric, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--spectrum-spacing-300)',
                  backgroundColor: 'var(--spectrum-background-layer-1)',
                  borderRadius: 'var(--spectrum-corner-radius-100)',
                  border: '1px solid var(--spectrum-border-color)',
                }}
              >
                <div style={{ flex: 1 }}>
                  <span style={{ 
                    fontSize: 'var(--spectrum-body-text-size)', 
                    color: 'var(--spectrum-body-color)',
                    fontWeight: 600
                  }}>
                    {metric.label}
                  </span>
                  <div style={{
                    marginTop: 'var(--spectrum-spacing-100)',
                    height: '6px',
                    backgroundColor: 'var(--spectrum-gray-200)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    width: '100%',
                    maxWidth: '200px'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${metric.score}%`,
                      backgroundColor: getScoreColor(metric.score),
                      transition: 'width 0.3s ease-out'
                    }} />
                  </div>
                </div>
                <span style={{ 
                  fontSize: 'var(--spectrum-heading-m-text-size)', 
                  fontWeight: 700, 
                  color: getScoreColor(metric.score),
                  marginLeft: 'var(--spectrum-spacing-300)'
                }}>
                  {metric.score}
                </span>
              </div>
            ))}
          </div>

          {/* Feedback */}
          {analysis.feedback.length > 0 && (
            <div style={{ marginBottom: 'var(--spectrum-spacing-400)' }}>
              <h3 className="spectrum-heading-l" style={{ 
                margin: '0 0 var(--spectrum-spacing-200) 0',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spectrum-spacing-100)'
              }}>
                <Lightbulb size={20} color="#00719f" />
                Feedback
              </h3>
              <ul style={{ 
                margin: 0,
                paddingLeft: 'var(--spectrum-spacing-400)',
                fontSize: 'var(--spectrum-body-text-size)',
                color: 'var(--spectrum-body-color)',
                lineHeight: 1.8
              }}>
                {analysis.feedback.map((item, index) => (
                  <li key={index} style={{ marginBottom: 'var(--spectrum-spacing-100)' }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div>
              <h3 className="spectrum-heading-l" style={{ 
                margin: '0 0 var(--spectrum-spacing-200) 0',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spectrum-spacing-100)'
              }}>
                <Sparkles size={20} color="#00719f" />
                Recommendations
              </h3>
              <ul style={{ 
                margin: 0,
                paddingLeft: 'var(--spectrum-spacing-400)',
                fontSize: 'var(--spectrum-body-text-size)',
                color: 'var(--spectrum-body-color)',
                lineHeight: 1.8
              }}>
                {analysis.recommendations.map((item, index) => (
                  <li key={index} style={{ marginBottom: 'var(--spectrum-spacing-100)' }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DesignAuditor;
