import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
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
          <h1 className="text-2xl font-bold text-foreground">Privacy Policy</h1>
        </div>
      </header>

      <main className="px-6 pb-12 max-w-md mx-auto">
        <div className="bg-card rounded-2xl p-6 shadow-soft space-y-6">
          <p className="text-sm text-muted-foreground">
            Last updated: February 8, 2026
          </p>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Overview</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              HabitBuddy ("we," "our," or "us") is committed to protecting your privacy and the privacy of your children. This Privacy Policy explains how we collect, use, and safeguard your information when you use our habit-tracking application.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Information We Collect</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We collect the following information to provide and improve our services:
            </p>
            <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1">
              <li>Parent email address and login credentials</li>
              <li>Parent name</li>
              <li>Children's first names</li>
              <li>Habit and reward data created within the app</li>
              <li>Progress and achievement records</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">How We Use Your Information</h2>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              The information gathered (parent email, login information, child's name, etc.) is only used for the proper functioning of HabitBuddy and will not be used for any other purpose.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Specifically, we use your information to:
            </p>
            <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1">
              <li>Create and manage your account</li>
              <li>Provide the habit-tracking functionality</li>
              <li>Track progress and award achievements</li>
              <li>Manage rewards and redemptions</li>
              <li>Send essential service-related communications</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">What We Do NOT Do</h2>
            <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1">
              <li>We do NOT sell your personal information to third parties</li>
              <li>We do NOT use your data for targeted advertising</li>
              <li>We do NOT share children's information with third parties</li>
              <li>We do NOT collect more data than necessary for the app to function</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Children's Privacy (COPPA Compliance)</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              HabitBuddy is designed with children's privacy in mind. We comply with the Children's Online Privacy Protection Act (COPPA):
            </p>
            <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1">
              <li>Children do not have their own accounts or login credentials</li>
              <li>All child data is managed through the parent's account</li>
              <li>We collect only the minimum information necessary (first name only)</li>
              <li>Parents have full control over their children's data</li>
              <li>Parents can delete their children's data at any time</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Data Security</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encrypted data transmission and secure storage practices.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Data Retention</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We retain your data only for as long as necessary to provide our services. If you delete your account, all associated data (including children's data) will be permanently deleted from our systems.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Your Rights</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You have the right to:
            </p>
            <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and all associated data</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Contact Us</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us at privacy@habitbuddy.app.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
