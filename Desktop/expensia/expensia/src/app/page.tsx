import AIExpenseSection from "./components/AIExpenseSection";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import WhyAISection from "./components/WhyAISection";

export default function HomePage() {
  return (
    <>
      {/* Hero Section - Top of the Page */}
      <section id="home">
        <Hero />
      </section>

      {/* AI Expense Extraction Section */}
      <section id="ai-expense">
        <AIExpenseSection />
      </section>

      {/* How It Works Section */}
      <section id="how-it-works">
        <HowItWorks />
      </section>

      {/* Why AI Section */}
      <section id="why-ai">
        <WhyAISection />
      </section>

      {/* More sections can be added below */}
    </>
  );
}
