import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { getBreadcrumbs } from '../../config/routes';
import '../../styles/navigation.css';

const Breadcrumbs = () => {
  const location = useLocation();
  const breadcrumbs = getBreadcrumbs(location.pathname);

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol className="breadcrumbs-list">
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isFirst = index === 0;

          return (
            <li key={breadcrumb.path} className="breadcrumb-item">
              {isLast ? (
                // Current page (not clickable)
                <span className="breadcrumb-current">
                  {isFirst ? <Home size={16} /> : breadcrumb.title}
                </span>
              ) : (
                // Clickable link
                <Link to={breadcrumb.path} className="breadcrumb-link">
                  {isFirst ? <Home size={16} /> : breadcrumb.title}
                </Link>
              )}
              
              {/* Separator */}
              {!isLast && (
                <ChevronRight size={16} className="breadcrumb-separator" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs; 