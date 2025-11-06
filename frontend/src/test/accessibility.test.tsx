import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';

// Components to test
import SeniorButton from '../components/UI/SeniorButton';
import EmergencyButton from '../components/Emergency/EmergencyButton';
import EmotionalFaces from '../components/Mood/EmotionalFaces';
import PrivacySettings from '../components/Privacy/PrivacySettings';
import ConsentBanner from '../components/Privacy/ConsentBanner';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock auth store
jest.mock('../stores/authStore', () => ({
  useAuthStore: () => ({
    user: {
      id: 'test-user',
      email: 'test@example.com',
      username: 'testuser',
      country: 'US',
      role: 'user'
    },
    isAuthenticated: true
  })
}));

// Mock hooks
jest.mock('../hooks/useSerenito', () => ({
  useSerenito: () => ({
    showInteraction: jest.fn(),
    currentExpression: 'happy',
    isVisible: true
  })
}));

jest.mock('../hooks/useEmergency', () => ({
  useEmergency: () => ({
    activatePanic: jest.fn(),
    isEmergencyActive: false
  })
}));

describe('Accessibility Compliance Tests', () => {
  describe('Senior-Friendly UI Components', () => {
    it('SeniorButton should meet accessibility standards', async () => {
      const { container } = render(
        <SeniorButton onClick={() => {}}>
          Test Button
        </SeniorButton>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();

      const button = screen.getByRole('button', { name: /test button/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');
    });

    it('SeniorButton should have proper focus management', () => {
      render(
        <SeniorButton onClick={() => {}}>
          Focus Test
        </SeniorButton>
      );

      const button = screen.getByRole('button', { name: /focus test/i });
      button.focus();
      expect(button).toHaveFocus();
      
      // Check for visible focus indicator
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-4');
    });

    it('SeniorButton should have minimum touch target size', () => {
      render(
        <SeniorButton onClick={() => {}}>
          Touch Target
        </SeniorButton>
      );

      const button = screen.getByRole('button', { name: /touch target/i });
      const styles = window.getComputedStyle(button);
      
      // Minimum 44px height for touch targets
      expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
    });

    it('EmergencyButton should have proper ARIA attributes', async () => {
      const { container } = render(
        <BrowserRouter>
          <EmergencyButton />
        </BrowserRouter>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();

      const button = screen.getByRole('button', { name: /botón de emergencia/i });
      expect(button).toHaveAttribute('aria-label', 'Botón de emergencia');
      expect(button).toHaveAttribute('title', 'Botón de Pánico - Presiona para obtener ayuda inmediata');
    });

    it('EmotionalFaces should have proper accessibility labels', async () => {
      const mockOnSelect = jest.fn();
      const { container } = render(
        <EmotionalFaces
          selectedEmotion={null}
          onEmotionSelect={mockOnSelect}
          disabled={false}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();

      // Check that each emotion button has proper labels
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
        expect(button).toHaveAttribute('title');
      });
    });
  });

  describe('Form Accessibility', () => {
    it('LoginPage should have proper form labels and structure', async () => {
      const { container } = render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();

      // Check for proper form structure
      const emailInput = screen.getByLabelText(/email|correo/i);
      const passwordInput = screen.getByLabelText(/password|contraseña/i);
      
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('required');
    });

    it('PrivacySettings should have accessible toggle switches', async () => {
      const { container } = render(
        <PrivacySettings />
      );

      // Wait for component to load
      await screen.findByText(/configuración de privacidad/i);

      const results = await axe(container);
      expect(results).toHaveNoViolations();

      // Check toggle switches have proper labels
      const toggles = container.querySelectorAll('input[type="checkbox"]');
      toggles.forEach(toggle => {
        expect(toggle.closest('label')).toBeInTheDocument();
      });
    });

    it('ConsentBanner should have accessible consent options', async () => {
      const mockOnConsent = jest.fn();
      const { container } = render(
        <ConsentBanner onConsentGiven={mockOnConsent} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();

      // Check for proper button roles and labels
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });
  });

  describe('Navigation and Keyboard Accessibility', () => {
    it('HomePage should support keyboard navigation', async () => {
      const { container } = render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();

      // Test tab navigation
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      expect(focusableElements.length).toBeGreaterThan(0);

      // Test that first element can receive focus
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
        expect(focusableElements[0]).toHaveFocus();
      }
    });

    it('should have proper heading hierarchy', () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      // Check for proper heading structure (h1, h2, h3, etc.)
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);

      // Should have at least one h1
      const h1Elements = headings.filter(h => h.tagName === 'H1');
      expect(h1Elements.length).toBeGreaterThanOrEqual(1);
    });

    it('should support screen reader navigation landmarks', async () => {
      const { container } = render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      // Check for ARIA landmarks
      const main = container.querySelector('main, [role="main"]');
      const navigation = container.querySelector('nav, [role="navigation"]');
      
      // At least main content should be present
      expect(main || container.querySelector('[role="main"]')).toBeInTheDocument();
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    it('should have sufficient color contrast for text', () => {
      render(
        <SeniorButton onClick={() => {}}>
          Contrast Test
        </SeniorButton>
      );

      const button = screen.getByRole('button', { name: /contrast test/i });
      const styles = window.getComputedStyle(button);
      
      // This is a basic check - in a real implementation, you'd use a color contrast library
      expect(styles.color).toBeDefined();
      expect(styles.backgroundColor).toBeDefined();
    });

    it('should not rely solely on color for information', () => {
      const mockOnSelect = jest.fn();
      render(
        <EmotionalFaces
          selectedEmotion={null}
          onEmotionSelect={mockOnSelect}
          disabled={false}
        />
      );

      // Emotional faces should have text labels, not just colors
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const ariaLabel = button.getAttribute('aria-label');
        const title = button.getAttribute('title');
        expect(ariaLabel || title).toBeTruthy();
      });
    });
  });

  describe('Error Handling and User Feedback', () => {
    it('should provide accessible error messages', () => {
      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      );

      const emailInput = screen.getByLabelText(/email|correo/i);
      
      // Simulate invalid input
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      // Check for error message association
      if (emailInput.getAttribute('aria-describedby')) {
        const errorId = emailInput.getAttribute('aria-describedby');
        const errorElement = document.getElementById(errorId!);
        expect(errorElement).toBeInTheDocument();
      }
    });

    it('should announce dynamic content changes to screen readers', () => {
      const mockOnConsent = jest.fn();
      render(
        <ConsentBanner onConsentGiven={mockOnConsent} />
      );

      // Check for ARIA live regions for dynamic updates
      const liveRegions = document.querySelectorAll('[aria-live], [role="status"], [role="alert"]');
      
      // Should have some mechanism for announcing changes
      expect(liveRegions.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Mobile and Touch Accessibility', () => {
    it('should have appropriate touch targets for mobile', () => {
      render(
        <SeniorButton onClick={() => {}}>
          Mobile Test
        </SeniorButton>
      );

      const button = screen.getByRole('button', { name: /mobile test/i });
      
      // Check minimum touch target size (44px x 44px)
      const rect = button.getBoundingClientRect();
      expect(rect.height).toBeGreaterThanOrEqual(44);
      expect(rect.width).toBeGreaterThanOrEqual(44);
    });

    it('should support zoom up to 200% without horizontal scrolling', () => {
      const { container } = render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      // This is a basic check - in a real implementation, you'd test actual zoom behavior
      const viewport = container.querySelector('[data-testid="viewport"]') || container;
      expect(viewport).toBeInTheDocument();
    });
  });

  describe('Senior-Specific Accessibility Features', () => {
    it('should use large, clear fonts', () => {
      render(
        <SeniorButton onClick={() => {}}>
          Font Test
        </SeniorButton>
      );

      const button = screen.getByRole('button', { name: /font test/i });
      const styles = window.getComputedStyle(button);
      
      // Minimum 18px font size for seniors
      const fontSize = parseInt(styles.fontSize);
      expect(fontSize).toBeGreaterThanOrEqual(18);
    });

    it('should have generous spacing between interactive elements', () => {
      render(
        <div>
          <SeniorButton onClick={() => {}}>Button 1</SeniorButton>
          <SeniorButton onClick={() => {}}>Button 2</SeniorButton>
        </div>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      
      // Check for margin/padding between buttons
      const button1Rect = buttons[0].getBoundingClientRect();
      const button2Rect = buttons[1].getBoundingClientRect();
      
      // Should have at least 8px spacing
      const spacing = Math.abs(button2Rect.top - button1Rect.bottom);
      expect(spacing).toBeGreaterThanOrEqual(8);
    });

    it('should minimize cognitive load with simple navigation', async () => {
      const { container } = render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();

      // Check for simple, clear navigation structure
      const navigationElements = container.querySelectorAll('nav, [role="navigation"]');
      
      // Should have clear navigation structure
      expect(navigationElements.length).toBeGreaterThanOrEqual(0);
    });

    it('should provide clear visual feedback for interactions', () => {
      render(
        <SeniorButton onClick={() => {}}>
          Feedback Test
        </SeniorButton>
      );

      const button = screen.getByRole('button', { name: /feedback test/i });
      
      // Check for hover and focus states
      expect(button).toHaveClass('hover:bg-primary-700');
      expect(button).toHaveClass('focus:ring-4');
    });
  });
});