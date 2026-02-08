import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-child">
      <header className="px-6 py-6 max-w-md mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Terms of Service</h1>
        </div>
      </header>

      <main className="px-6 pb-12 max-w-md mx-auto">
        <div className="bg-card rounded-2xl p-6 shadow-soft space-y-6">
          <p className="text-sm text-muted-foreground">
            Last updated: February 8, 2026
          </p>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              By accessing or using HabitBuddy ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">2. Description of Service</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              HabitBuddy is a family-oriented habit-tracking application that allows parents to create and manage habits for their children, track progress, and reward positive behavior. The Service is designed to help families build better habits together.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">3. User Accounts</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              To use HabitBuddy, you must create an account. You are responsible for:
            </p>
            <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1">
              <li>Providing accurate and complete registration information</li>
              <li>Maintaining the security of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">4. Parental Responsibility</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              As a parent using HabitBuddy, you acknowledge and agree that:
            </p>
            <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1">
              <li>You are responsible for all content and data entered for your children</li>
              <li>You will use the Service in a manner appropriate for your family</li>
              <li>You consent to the collection and use of your children's information as described in our Privacy Policy</li>
              <li>You are responsible for supervising your children's use of Child Mode</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">5. Acceptable Use</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You agree not to:
            </p>
            <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Upload malicious content or software</li>
              <li>Impersonate any person or entity</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">6. Intellectual Property</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The Service, including its original content, features, and functionality, is owned by HabitBuddy and is protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">7. User Content</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You retain ownership of any content you create within the Service (such as habits, rewards, and children's profiles). By using the Service, you grant us a limited license to store and display this content solely for the purpose of providing the Service to you.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">8. Service Availability</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We strive to maintain the Service's availability but do not guarantee uninterrupted access. We reserve the right to modify, suspend, or discontinue the Service at any time with reasonable notice.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">9. Limitation of Liability</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              To the fullest extent permitted by law, HabitBuddy shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">10. Termination</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We may terminate or suspend your account at any time for violations of these Terms. You may also delete your account at any time. Upon termination, your right to use the Service will cease immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">11. Changes to Terms</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify users of significant changes. Your continued use of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">12. Contact</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at support@habitbuddy.app.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;
