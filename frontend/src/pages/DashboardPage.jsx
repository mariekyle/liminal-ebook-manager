import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { useBooks } from '../hooks/useBooks';
import { 
  BookOpen, 
  Upload, 
  Clock, 
  TrendingUp,
  User,
  Calendar
} from 'lucide-react';
import '../styles/dashboard.css';

const DashboardPage = () => {
  const { user } = useContext(AppContext);
  const { books, loading, error } = useBooks();
  const [stats, setStats] = useState({
    totalBooks: 0,
    recentBooks: 0,
    totalSize: 0,
    averageRating: 0
  });

  useEffect(() => {
    if (books) {
      const totalBooks = books.length;
      const recentBooks = books.filter(book => {
        const bookDate = new Date(book.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return bookDate > weekAgo;
      }).length;

      const totalSize = books.reduce((sum, book) => sum + (book.file_size || 0), 0);
      const averageRating = books.length > 0 
        ? books.reduce((sum, book) => sum + (book.rating || 0), 0) / books.length 
        : 0;

      setStats({
        totalBooks,
        recentBooks,
        totalSize: (totalSize / (1024 * 1024)).toFixed(1), // Convert to MB
        averageRating: averageRating.toFixed(1)
      });
    }
  }, [books]);

  const formatFileSize = (sizeInMB) => {
    if (sizeInMB >= 1024) {
      return `${(sizeInMB / 1024).toFixed(1)} GB`;
    }
    return `${sizeInMB} MB`;
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'blue' }) => (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-icon">
        <Icon size={24} />
      </div>
      <div className="stat-content">
        <h3 className="stat-value">{value}</h3>
        <p className="stat-title">{title}</p>
        {subtitle && <p className="stat-subtitle">{subtitle}</p>}
      </div>
    </div>
  );

  const QuickAction = ({ icon: Icon, title, description, action, color = 'blue' }) => (
    <div className={`quick-action quick-action-${color}`} onClick={action}>
      <div className="quick-action-icon">
        <Icon size={24} />
      </div>
      <div className="quick-action-content">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Error loading dashboard</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Welcome section */}
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {user?.display_name || user?.username}!</h1>
          <p>Here's what's happening with your library today.</p>
        </div>
        <div className="dashboard-date">
          <Calendar size={20} />
          <span>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
      </div>

      {/* Statistics */}
      <div className="stats-grid">
        <StatCard
          icon={BookOpen}
          title="Total Books"
          value={stats.totalBooks}
          subtitle="in your library"
          color="blue"
        />
        <StatCard
          icon={Clock}
          title="Recent Books"
          value={stats.recentBooks}
          subtitle="added this week"
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          title="Library Size"
          value={formatFileSize(stats.totalSize)}
          subtitle="total storage"
          color="purple"
        />
        <StatCard
          icon={User}
          title="Account"
          value={user?.role || 'User'}
          subtitle="your role"
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions-grid">
          <QuickAction
            icon={Upload}
            title="Upload Book"
            description="Add a new book to your library"
            action={() => window.location.href = '/upload'}
            color="blue"
          />
          <QuickAction
            icon={BookOpen}
            title="Browse Library"
            description="View and manage your books"
            action={() => window.location.href = '/library'}
            color="green"
          />
          <QuickAction
            icon={User}
            title="View Profile"
            description="Update your account settings"
            action={() => window.location.href = '/profile'}
            color="purple"
          />
        </div>
      </div>

      {/* Recent Activity */}
      {books && books.length > 0 && (
        <div className="recent-activity-section">
          <h2>Recent Books</h2>
          <div className="recent-books-grid">
            {books.slice(0, 6).map(book => (
              <div key={book.id} className="recent-book-card">
                <div className="book-cover">
                  {book.cover_path ? (
                    <img src={book.cover_path} alt={book.title} />
                  ) : (
                    <div className="book-cover-placeholder">
                      <BookOpen size={32} />
                    </div>
                  )}
                </div>
                <div className="book-info">
                  <h3>{book.title}</h3>
                  <p>{book.author}</p>
                  <span className="book-date">
                    {new Date(book.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage; 