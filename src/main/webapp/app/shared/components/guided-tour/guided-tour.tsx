/* eslint-disable react/no-unescaped-entities */
import React, { useState, useEffect } from 'react';
import Joyride, { STATUS, CallBackProps, Step, Placement } from 'react-joyride';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from 'app/config/store';
import { getSetupStatus, updateSetupStatus } from 'app/entities/settings/guided-tour/guided-tour.reducer';

const TOUR_STEPS_KEY = 'tour_current_step';

interface GuidedTourProps {
  isVisible?: boolean;
  onComplete?: () => void;
}

const GuidedTour: React.FC<GuidedTourProps> = ({ isVisible = true, onComplete }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  
  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [waitingForSave, setWaitingForSave] = useState(false);

  const isAuthenticated = useAppSelector(state => state.authentication.isAuthenticated);
  const sessionHasBeenFetched = useAppSelector(state => state.authentication.sessionHasBeenFetched);
  const account = useAppSelector(state => state.authentication.account);
  
  // Redux state from guided tour reducer
  const setupCompleted = useAppSelector(state => state.guidedTour.setupCompleted);
  const guidedTourLoading = useAppSelector(state => state.guidedTour.loading);
  const guidedTourUpdateSuccess = useAppSelector(state => state.guidedTour.updateSuccess);
  
  // Monitor save states from Redux
  const businessDetailUpdateSuccess = useAppSelector(state => state.businessDetail.updateSuccess);
  const currencySettingsUpdateSuccess = useAppSelector(state => state.currencySettings.updateSuccess);

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div>
          <h3>Welcome to your business setup!</h3>
          <p>Let's get your essential business information configured. This tour will guide you through the required settings.</p>
        </div>
      ),
      placement: 'center' as Placement,
      disableBeacon: true,
    },
    {
      target: 'body',
      content: (
        <div>
          <h4>Step 1: Access Settings</h4>
          <p>First, let's access your business settings:</p>
          <ol>
            <li>Look at the sidebar on the left</li>
            <li>Click on the <strong>Settings</strong> icon (gear icon)</li>
            <li>Then click on <strong>"Business Information"</strong> from the menu</li>
          </ol>
          <p>Click "Next" once you've navigated to the Business Information page.</p>
        </div>
      ),
      placement: 'center' as Placement,
      disableBeacon: true,
    },
    {
      target: 'body',
      content: (
        <div>
          <h4>Step 2: Fill Business Information</h4>
          <p>Now you should see the Business Information form. Please fill in:</p>
          <ul>
            <li><strong>Business Name</strong> (required)</li>
            <li><strong>Slogan</strong> (optional but recommended)</li>
            <li><strong>Logo</strong> (optional but recommended)</li>
          </ul>
          <p>Once you've filled in the information, <strong>click the "Save" button</strong>.</p>
          <p><em>The tour will automatically continue after you save.</em></p>
        </div>
      ),
      placement: 'center' as Placement,
      disableBeacon: true,
    },
    {
      target: 'body',
      content: (
        <div>
          <h4>⏸️ Tour Paused - Fill Your Information</h4>
          <p>Please complete the business information form:</p>
          <ol>
            <li>Enter your <strong>business name</strong></li>
            <li>Add a <strong>slogan</strong> (optional)</li>
            <li>Upload your <strong>logo</strong> (optional)</li>
            <li><strong>Click the Save button</strong> when done</li>
          </ol>
          <p>The tour will automatically continue once you save your changes.</p>
        </div>
      ),
      placement: 'center' as Placement,
      disableBeacon: true,
    },
    {
      target: 'body',
      content: (
        <div>
          <h4>Step 3: Currency Settings</h4>
          <p>Great! Your business information has been saved. Now let's set up your default currency:</p>
          <ol>
            <li>In the Settings menu, click on <strong>"Currencies"</strong></li>
            <li>This will take you to the currency settings page</li>
          </ol>
          <p>Click "Next" once you're on the Currencies page.</p>
        </div>
      ),
      placement: 'center' as Placement,
      disableBeacon: true,
    },
    {
      target: 'body',
      content: (
        <div>
          <h4>Step 4: Set Default Currency</h4>
          <p>Now you should see the currency settings. Please:</p>
          <ol>
            <li>Select your <strong>default currency</strong> from the dropdown</li>
            <li>Click <strong>"Set Default Currency"</strong> button</li>
          </ol>
          <p>⚠️ <strong>Important:</strong> This cannot be changed later, so choose carefully!</p>
          <p><em>The tour will automatically continue after you save.</em></p>
        </div>
      ),
      placement: 'center' as Placement,
      disableBeacon: true,
    },
    {
      target: 'body',
      content: (
        <div>
          <h4>⏸️ Tour Paused - Set Your Currency</h4>
          <p>Please set up your default currency:</p>
          <ol>
            <li>Select your <strong>default currency</strong> from the dropdown</li>
            <li>Click <strong>"Set Default Currency"</strong> button</li>
          </ol>
          <p>⚠️ <strong>Important:</strong> This cannot be changed later, so choose carefully!</p>
          <p>The tour will continue once you've saved your currency setting.</p>
        </div>
      ),
      placement: 'center' as Placement,
      disableBeacon: true,
    },
    {
      target: 'body',
      content: (
        <div>
          <h3>Setup Complete! 🎉</h3>
          <p>Excellent work! You've successfully configured:</p>
          <ul>
            <li>✅ Business Information</li>
            <li>✅ Default Currency</li>
          </ul>
          <p>Your system is now ready to use!</p>
        </div>
      ),
      placement: 'center' as Placement,
      disableBeacon: true,
    },
  ];

  useEffect(() => {
    // Fetch setup status when component mounts
    if (isAuthenticated && sessionHasBeenFetched) {
      dispatch(getSetupStatus());
    }
  }, [isAuthenticated, sessionHasBeenFetched, dispatch]);

  useEffect(() => {
    const savedStep = localStorage.getItem(TOUR_STEPS_KEY);
    
    if (!setupCompleted && isAuthenticated && isVisible && sessionHasBeenFetched && !guidedTourLoading) {
      setRunTour(true);
      if (savedStep) {
        setStepIndex(parseInt(savedStep, 10));
      }
    } else if (setupCompleted) {
      setRunTour(false);
    } else {
      // Not ready to start yet (auth/session not ready)
      setRunTour(false);
    }
  }, [isAuthenticated, sessionHasBeenFetched, isVisible, setupCompleted, guidedTourLoading]);

  useEffect(() => {
    // Always save the current step to localStorage, even when paused
    localStorage.setItem(TOUR_STEPS_KEY, stepIndex.toString());
  }, [stepIndex]);

  // Monitor save success to auto-resume tour
  useEffect(() => {
    if (waitingForSave && businessDetailUpdateSuccess && stepIndex === 3) {
      console.log('✅ Business details saved! Resuming tour...');
      console.log('🔍 Current tour state:', { waitingForSave, stepIndex, runTour, isPaused });
      
      clearFieldHighlights();
      setWaitingForSave(false);
      setIsPaused(false);
      setRunTour(true);
      setStepIndex(4); // Move to currency settings step
      
      console.log('🎭 Tour state after business save:', {
        waitingForSave: false,
        isPaused: false,
        runTour: true,
        stepIndex: 4
      });
    }
  }, [businessDetailUpdateSuccess, waitingForSave, stepIndex]);

  useEffect(() => {
    if (waitingForSave && currencySettingsUpdateSuccess && stepIndex === 6) {
      console.log('✅ Currency settings saved! Completing tour...');
      clearFieldHighlights();
      setWaitingForSave(false);
      setIsPaused(false);
      setRunTour(true);
      setStepIndex(7); // Move to completion step
    }
  }, [currencySettingsUpdateSuccess, waitingForSave, stepIndex]);

  // Field highlighting system
  const highlightBusinessFields = () => {
    const businessNameField = document.querySelector('input[name="businessName"]');
    const sloganField = document.querySelector('input[name="slogan"]');
    const logoUpload = document.querySelector('[data-tour="logo-upload"]');
    const saveButton = document.querySelector('[data-tour="business-save-button"]');
    
    if (businessNameField && businessNameField instanceof HTMLElement) {
      businessNameField.style.border = '3px solid #ff6b6b';
      businessNameField.style.boxShadow = '0 0 10px rgba(255, 107, 107, 0.5)';
      businessNameField.style.backgroundColor = 'rgba(255, 107, 107, 0.1)';
    }
    
    if (sloganField && sloganField instanceof HTMLElement) {
      sloganField.style.border = '2px solid #ffc107';
      sloganField.style.boxShadow = '0 0 8px rgba(255, 193, 7, 0.5)';
      sloganField.style.backgroundColor = 'rgba(255, 193, 7, 0.05)';
    }
    
    if (logoUpload && logoUpload instanceof HTMLElement) {
      logoUpload.style.border = '2px dashed #17a2b8';
      logoUpload.style.borderRadius = '8px';
      logoUpload.style.backgroundColor = 'rgba(23, 162, 184, 0.05)';
      logoUpload.style.padding = '8px';
    }

    if (saveButton && saveButton instanceof HTMLElement) {
      saveButton.style.animation = 'pulse 2s infinite';
      saveButton.style.boxShadow = '0 0 15px rgba(40, 167, 69, 0.6)';
    }
  };

  const highlightCurrencyFields = () => {
    const currencySection = document.querySelector('[data-tour="default-currency"]');
    const currencySaveButton = document.querySelector('[data-tour="currency-save-button"]');
    
    if (currencySection && currencySection instanceof HTMLElement) {
      currencySection.style.border = '3px solid #ff6b6b';
      currencySection.style.borderRadius = '8px';
      currencySection.style.backgroundColor = 'rgba(255, 107, 107, 0.1)';
      currencySection.style.padding = '12px';
      currencySection.style.boxShadow = '0 0 15px rgba(255, 107, 107, 0.5)';
    }

    if (currencySaveButton && currencySaveButton instanceof HTMLElement) {
      currencySaveButton.style.animation = 'pulse 2s infinite';
      currencySaveButton.style.boxShadow = '0 0 15px rgba(40, 167, 69, 0.6)';
    }
  };

  const clearFieldHighlights = () => {
    // Clear business field highlights
    const businessFields = [
      'input[name="businessName"]',
      'input[name="slogan"]',
      '[data-tour="logo-upload"]',
      '[data-tour="business-save-button"]'
    ];
    
    businessFields.forEach(selector => {
      const element = document.querySelector(selector);
      if (element && element instanceof HTMLElement) {
        element.style.border = '';
        element.style.boxShadow = '';
        element.style.backgroundColor = '';
        element.style.padding = '';
        element.style.borderRadius = '';
        element.style.animation = '';
      }
    });

    // Clear currency field highlights
    const currencyFields = [
      '[data-tour="default-currency"]',
      '[data-tour="currency-save-button"]'
    ];
    
    currencyFields.forEach(selector => {
      const element = document.querySelector(selector);
      if (element && element instanceof HTMLElement) {
        element.style.border = '';
        element.style.boxShadow = '';
        element.style.backgroundColor = '';
        element.style.padding = '';
        element.style.borderRadius = '';
        element.style.animation = '';
      }
    });
  };

  // Apply highlights when waiting for save
  useEffect(() => {
    if (waitingForSave) {
      if (stepIndex === 3) {
        // Delay to ensure elements are loaded
        setTimeout(() => {
          highlightBusinessFields();
        }, 300);
      } else if (stepIndex === 6) {
        setTimeout(() => {
          highlightCurrencyFields();
        }, 300);
      }
    } else {
      clearFieldHighlights();
    }
    
    // Cleanup on unmount or when tour completes
    return () => {
      if (setupCompleted) {
        clearFieldHighlights();
      }
    };
  }, [waitingForSave, stepIndex, setupCompleted]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, index, type } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRunTour(false);
      dispatch(updateSetupStatus(true));
      localStorage.removeItem(TOUR_STEPS_KEY);
      onComplete?.();
    } else if (type === 'step:after') {
      // Handle tour progression
      if (index === 1) {
        // After step 1 instructions, navigate to business details page
        console.log('🚀 Navigating to business details page...');
        navigate('/details');
        setStepIndex(index + 1);
        return;
      } else if (index === 2) {
        // After showing business information instructions, move to pause step
        console.log('⏸️ Pausing tour for business information entry...');
        setStepIndex(3);
        setIsPaused(true);
        setWaitingForSave(true);
        setRunTour(false);
        return;
      } else if (index === 4) {
        // After step 4 instructions, navigate to currencies page
        console.log('🚀 Navigating to currencies page...');
        navigate('/currencies');
        setStepIndex(index + 1);
        return;
      } else if (index === 5) {
        // After showing currency instructions, move to pause step
        console.log('⏸️ Pausing tour for currency selection...');
        setStepIndex(6);
        setIsPaused(true);
        setWaitingForSave(true);
        setRunTour(false);
        return;
      }
      
      // For other steps, proceed normally
      setStepIndex(index + 1);
    }
  };

  const resetTour = () => {
    console.log('🔄 Resetting tour...');
    dispatch(updateSetupStatus(false));
    localStorage.removeItem(TOUR_STEPS_KEY);
    setStepIndex(0);
    setRunTour(true);
    setIsPaused(false);
    setWaitingForSave(false);
  };

  const skipTour = () => {
    setRunTour(false);
    setIsPaused(false);
    setWaitingForSave(false);
    dispatch(updateSetupStatus(true));
    localStorage.removeItem(TOUR_STEPS_KEY);
    onComplete?.();
  };

  const pauseTour = () => {
    console.log('⏸️ Manually pausing tour...');
    setIsPaused(true);
    setRunTour(false);
  };

  const resumeTour = () => {
    console.log('▶️ Manually resuming tour...');
    setIsPaused(false);
    setRunTour(true);
  };

  // Debug logging for render conditions
  console.log('🔍 Tour Render Check:', {
    setupCompleted,
    isAuthenticated,
    sessionHasBeenFetched,
    runTour,
    isPaused,
    waitingForSave,
    stepIndex,
    willRender: !(setupCompleted || !isAuthenticated || !sessionHasBeenFetched)
  });

  if (setupCompleted || !isAuthenticated || !sessionHasBeenFetched || guidedTourLoading) {
    console.log('🚫 Tour not rendering:', { setupCompleted, isAuthenticated, sessionHasBeenFetched, guidedTourLoading });
    return null;
  }

  console.log('🎭 Rendering Joyride with:', { runTour, stepIndex, stepsLength: steps.length });

  return (
    <>
      {/* CSS for field highlighting */}
      <style>
        {`
          @keyframes pulse {
            0% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7);
            }
            70% {
              transform: scale(1.05);
              box-shadow: 0 0 0 10px rgba(40, 167, 69, 0);
            }
            100% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(40, 167, 69, 0);
            }
          }
        `}
      </style>
      
      <Joyride
        steps={steps}
        run={runTour}
        stepIndex={stepIndex}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#696cff',
            textColor: '#333',
            backgroundColor: 'white',
            overlayColor: 'rgba(0, 0, 0, 0.4)',
            arrowColor: 'white',
            zIndex: 10000,
          },
          buttonNext: {
            backgroundColor: '#696cff',
            fontSize: '14px',
            padding: '8px 16px',
          },
          buttonBack: {
            color: '#696cff',
            fontSize: '14px',
            padding: '8px 16px',
          },
          buttonSkip: {
            color: '#999',
            fontSize: '14px',
          },
          tooltip: {
            fontSize: '14px',
          },
          tooltipContent: {
            padding: '16px',
          },
          tooltipTitle: {
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '8px',
          },
        }}
        locale={{
          back: 'Previous',
          close: 'Close',
          last: 'Finish Setup',
          next: 'Next',
          skip: 'Skip Tour',
        }}
      />
      
      {/* Tour Status Indicator */}
      {(isPaused || waitingForSave) && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: waitingForSave ? '#ffc107' : '#17a2b8',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 10001,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: '2px solid rgba(255,255,255,0.2)'
        }}>
          {waitingForSave ? (
            <>
              ⏳ Please complete the highlighted fields...
              {stepIndex === 3 && (
                <div style={{ fontSize: '12px', marginTop: '8px', lineHeight: '1.4' }}>
                  <div>📝 <strong style={{ color: '#ff6b6b' }}>Business Name</strong> (required)</div>
                  <div>💭 <strong style={{ color: '#17a2b8' }}>Slogan</strong> (recommended)</div>
                  <div>🖼️ <strong style={{ color: '#17a2b8' }}>Logo</strong> (recommended)</div>
                  <div style={{ marginTop: '6px', fontWeight: 'bold' }}>Then click the Save button!</div>
                </div>
              )}
              {stepIndex === 6 && (
                <div style={{ fontSize: '12px', marginTop: '8px', lineHeight: '1.4' }}>
                  <div>💱 <strong style={{ color: '#ff6b6b' }}>Select Default Currency</strong></div>
                  <div style={{ marginTop: '6px', fontWeight: 'bold' }}>Then click "Set Default Currency"!</div>
                </div>
              )}
            </>
          ) : (
            '⏸️ Tour Paused'
          )}
        </div>
      )}

      {/* Development helper - remove in production */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          position: 'fixed', 
          bottom: '20px', 
          right: '20px', 
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={resetTour}
              style={{
                background: '#ff6b6b',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Reset Tour
            </button>
            <button
              onClick={skipTour}
              style={{
                background: '#51cf66',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Skip Tour
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={pauseTour}
              disabled={isPaused}
              style={{
                background: isPaused ? '#6c757d' : '#ffc107',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: isPaused ? 'not-allowed' : 'pointer',
              }}
            >
              Pause Tour
            </button>
            <button
              onClick={resumeTour}
              disabled={!isPaused || waitingForSave}
              style={{
                background: (!isPaused || waitingForSave) ? '#6c757d' : '#17a2b8',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: (!isPaused || waitingForSave) ? 'not-allowed' : 'pointer',
              }}
            >
              Resume Tour
            </button>
          </div>
          <div style={{ 
            fontSize: '10px', 
            color: '#666', 
            textAlign: 'center',
            background: 'rgba(255,255,255,0.9)',
            padding: '4px 8px',
            borderRadius: '4px'
          }}>
            Step: {stepIndex + 1}/8 | {isPaused ? 'Paused' : 'Running'} {waitingForSave ? '| Waiting for save' : ''}
          </div>
        </div>
      )} */}
    </>
  );
};

export default GuidedTour; 