import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntity } from './tv.reducer';
import { ICarouselPage, ICarouselItemElement } from 'app/shared/model/TV/tv.model';

const TVViewer = () => {
  const dispatch = useAppDispatch();
  const { id } = useParams<'id'>();
  const tv = useAppSelector(state => state.tv.entity);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      dispatch(getEntity(id));
    }
  }, [id, dispatch]);

  useEffect(() => {
    if (!tv.carouselPages || tv.carouselPages.length === 0) return;

    const currentPage = tv.carouselPages[currentPageIndex];
    const duration = (currentPage?.duration || 5) * 1000;

    const timer = setTimeout(() => {
      setCurrentPageIndex((prevIndex) => 
        (prevIndex + 1) % tv.carouselPages.length
      );
    }, duration);

    return () => clearTimeout(timer);
  }, [currentPageIndex, tv.carouselPages]);

  const renderElement = (element: ICarouselItemElement) => {
    const elementStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${element.position.x}%`,
      top: `${element.position.y}%`,
      width: `${element.size.width}%`,
      height: `${element.size.height}%`,
      overflow: 'hidden',
    };

    if (element.type === 'text') {
      return (
        <div
          key={element.id}
          style={{
            ...elementStyle,
            fontSize: `${(element.style?.fontSize || 24) * 0.8}px`, // Scale down for mobile
            color: element.style?.color || '#ffffff',
            fontWeight: element.style?.fontWeight || 'normal',
            textAlign: (element.style?.textAlign as React.CSSProperties['textAlign']) || 'left',
            display: 'flex',
            alignItems: 'center',
            padding: '8px',
            wordWrap: 'break-word',
            lineHeight: 1.2,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        >
          {element.content}
        </div>
      );
    } else {
      return (
        <img
          key={element.id}
          src={element.content}
          alt="Display element"
          style={{
            ...elementStyle,
            objectFit: 'cover',
            borderRadius: '4px'
          }}
        />
      );
    }
  };

  if (!tv.carouselPages || tv.carouselPages.length === 0) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontSize: '24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        No content available
      </div>
    );
  }

  const currentPage = tv.carouselPages[currentPageIndex];
  const aspectRatio = tv.dimensions ? tv.dimensions.width / tv.dimensions.height : 16/9;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000000',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Main content area with aspect ratio preserved */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          position: 'relative',
          width: window.innerWidth > window.innerHeight * aspectRatio ? 
                 `${window.innerHeight * aspectRatio}px` : '100vw',
          height: window.innerWidth > window.innerHeight * aspectRatio ? 
                  '100vh' : `${window.innerWidth / aspectRatio}px`,
          backgroundColor: '#000000'
        }}>
          {currentPage?.elements.map(renderElement)}
        </div>
      </div>

      {/* Page indicator (optional, can be removed for production) */}
      {tv.carouselPages.length > 1 && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '8px',
          zIndex: 1000
        }}>
          {tv.carouselPages.map((_, index) => (
            <div
              key={index}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: index === currentPageIndex ? '#ffffff' : 'rgba(255,255,255,0.3)',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TVViewer; 