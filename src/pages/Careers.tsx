import React from 'react';
import SEO from '../components/SEO';
import { Briefcase, MapPin, Code, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const openRoles = [
  {
    id: 1,
    title: 'Senior Full Stack Engineer',
    department: 'Engineering',
    location: 'Nairobi, Kenya (Hybrid) / Remote',
    type: 'Full-time',
    icon: Code
  },
  {
    id: 2,
    title: 'Developer Advocate',
    department: 'DevRel',
    location: 'Remote (EMEA)',
    type: 'Full-time',
    icon: Users
  },
  {
    id: 3,
    title: 'Customer Success Specialist',
    department: 'Support',
    location: 'Nairobi, Kenya',
    type: 'Full-time',
    icon: Users
  }
];

export default function Careers() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-secondary-900 transition-colors pt-24 pb-20">
      <SEO 
        title="Careers" 
        description="Join Arrotech Solutions. We are hiring engineers, designers, and support staff to build the future of unified workspaces."
        url="/careers"
      />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter">
            Build the Future of Work
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            We're a fast-growing team based in Nairobi, building global software to cure context switching. Join us in our mission to unify the digital workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white dark:bg-secondary-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-secondary-700">
            <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center mb-6">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Meaningful Work</h3>
            <p className="text-slate-600 dark:text-slate-400">
              The tools we build directly save professionals hours of their day. Your code will help thousands of people focus on what matters.
            </p>
          </div>
          
          <div className="bg-white dark:bg-secondary-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-secondary-700">
            <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center mb-6">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Work from Anywhere</h3>
            <p className="text-slate-600 dark:text-slate-400">
              While our hub is in Nairobi, we are a remote-friendly organization. We care about your output, not where your laptop is plugged in.
            </p>
          </div>

          <div className="bg-white dark:bg-secondary-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-secondary-700">
            <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Continuous Growth</h3>
            <p className="text-slate-600 dark:text-slate-400">
              We invest heavily in our team's learning with stipends for courses, conferences, and books. When you grow, Arrotech grows.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
            Open Positions
          </h2>
          
          <div className="space-y-4">
            {openRoles.map((role) => (
              <div 
                key={role.id} 
                className="group bg-white dark:bg-secondary-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm hover:shadow-md border border-slate-200 dark:border-secondary-700 transition-all cursor-pointer"
              >
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {role.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2.5 py-1 rounded-md">
                      {role.department}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" /> {role.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4" /> {role.type}
                    </span>
                  </div>
                </div>
                <div className="mt-6 sm:mt-0">
                  <Link 
                    to="/help"
                    className="inline-flex items-center px-6 py-2.5 rounded-lg text-sm font-bold bg-slate-100 dark:bg-secondary-700 text-slate-900 dark:text-white hover:bg-primary-50 hover:text-primary-700 dark:hover:bg-primary-900/40 dark:hover:text-primary-300 transition-colors"
                  >
                    Apply Now
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center p-8 bg-primary-50 dark:bg-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-900/30">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Don't see a fit?</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              We're always on the lookout for exceptional talent. Send your CV and a brief introduction to our team.
            </p>
            <Link to="/help" className="text-primary-600 dark:text-primary-400 font-bold hover:underline">
              Email our hiring team &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
