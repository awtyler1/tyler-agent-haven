import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Check, X } from "lucide-react";

import austinHeadshot from "@/assets/austin-headshot.jpg";
import andrewHeadshot from "@/assets/andrew-headshot.png";
import carolineHeadshot from "@/assets/caroline-headshot.jpg";

const leadership = [
  {
    name: "Austin Tyler, MBA",
    role: "Broker Development",
    focus: "Vision, standards, and strategic direction",
    image: austinHeadshot
  },
  {
    name: "Andrew Horn, MHA",
    role: "Broker Development",
    focus: "Operations, agent support, and platform",
    image: andrewHeadshot
  },
  {
    name: "Caroline Horn",
    role: "Director of Operations",
    focus: "Contracting, carrier communications, onboarding",
    image: carolineHeadshot
  }
];

const fmoIs = [
  "The strategic engine behind your Medicare business",
  "The bridge between you and the carriers",
  "A support system for contracting, training, and tools",
  "A partner in your long-term development"
];

const fmoIsNot = [
  "A call center",
  "A lead vendor",
  "A babysitter",
  "A shortcut"
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Navigation />

      <main className="pt-24 pb-16 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="mb-12">
            <h1 className="text-2xl font-medium text-slate-900 mb-1">About Tyler Insurance Group</h1>
            <p className="text-slate-500">Kentucky's Medicare-focused FMO</p>
          </div>

          {/* Leadership - First, most visual */}
          <section className="mb-12">
            <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">Leadership</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {leadership.map((person) => (
                <div
                  key={person.name}
                  className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 text-center"
                >
                  <img
                    src={person.image}
                    alt={person.name}
                    className="w-20 h-20 rounded-full object-cover object-top mx-auto mb-3"
                  />
                  <h3 className="font-semibold text-slate-900">{person.name}</h3>
                  <p className="text-sm text-[#b8860b] mb-2">{person.role}</p>
                  <p className="text-xs text-slate-500">{person.focus}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Mission & Vision - Combined, concise */}
          <section className="mb-12">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Our Mission</h2>
              <p className="text-slate-700 leading-relaxed mb-6">
                To build elite, independent agents who serve clients with integrity and discipline — supported by structure, training, and operational excellence.
              </p>
              <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Our Vision</h2>
              <p className="text-slate-700 leading-relaxed">
                To become the most trusted Medicare-focused FMO in Kentucky and beyond.
              </p>
            </div>
          </section>

          {/* FMO Is / Is Not - Side by side */}
          <section>
            <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">What We Do</h2>
            <div className="grid md:grid-cols-2 gap-4">

              {/* FMO Is */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                <h3 className="font-semibold text-slate-900 mb-4">An FMO Is</h3>
                <ul className="space-y-3">
                  {fmoIs.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-[#b8860b] flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* FMO Is Not */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <h3 className="font-semibold text-slate-900 mb-4">An FMO Is Not</h3>
                <ul className="space-y-3">
                  {fmoIsNot.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <X className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-500">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
