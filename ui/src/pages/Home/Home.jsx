import React from 'react';
import Navbar from '../../components/Navbar/Navbar';
import Hero from '../../components/Hero/Hero';
import Stats from '../../components/Stats/Stats';
import AnnualAwards from '../../components/AnnualAwards/AnnualAwards';
import Categories from '../../components/Categories/Categories';
import Jury from '../../components/Jury/Jury';
import PastWinners from '../../components/PastWinners/PastWinners';
import CTA from '../../components/CTA/CTA';
import Footer from '../../components/Footer/Footer';

const Home = () => {
  return (
    <div className="home-page">
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <AnnualAwards />
        <Categories />
        <Jury />
        <PastWinners />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
