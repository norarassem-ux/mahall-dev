import { Routes, Route } from "react-router-dom";
import Nav from "./components/Nav.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Venues from "./pages/Venues.jsx";
import VenueDetail from "./pages/VenueDetail.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import Faq from "./pages/Faq.jsx";
import ListVenue from "./pages/ListVenue.jsx";
import OwnerDashboard from "./pages/OwnerDashboard.jsx";
import SupportWidget from "./components/SupportWidget.jsx";
import Pricing from "./pages/Pricing.jsx";

export default function App() {
  return (
    <div id="mahall">
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/venues" element={<Venues />} />
        <Route path="/venues/:idOrSlug" element={<VenueDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/list-your-venue" element={<ListVenue />} />
        <Route path="/dashboard" element={<OwnerDashboard />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="*" element={<p style={{ padding: "60px 0" }}>Page not found.</p>} />
      </Routes>
      <Footer />
      <SupportWidget />
    </div>
  );
}
