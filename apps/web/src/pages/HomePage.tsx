import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { AboutSection } from '@/features/about/AboutSection';
import { useProfile } from '@/features/about/queries';
import { Hero } from '@/features/hero/Hero';
import { ProjectsSection } from '@/features/projects/ProjectsSection';
import { ScrollRace } from '@/features/scroll-race/ScrollRace';
import { SkillsSection } from '@/features/skills/SkillsSection';

export function HomePage() {
  const { data: profile } = useProfile();
  const heroRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <Navbar brand={profile?.name.split(' ')[0] ?? 'Portfólio'} />
      <ScrollRace heroRef={heroRef} />
      <main id="top">
        <div ref={heroRef}>
          <Hero />
        </div>
        <ProjectsSection />
        <AboutSection />
        <SkillsSection />
      </main>
      <Footer profile={profile} />
    </>
  );
}
import { useRef } from 'react';
