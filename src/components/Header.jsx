import React from 'react';

import { useState,useEffect } from 'react';
import { data, Link } from 'react-router';
import { Search, Camera, ShoppingBag, Heart, User, LayoutGrid, ChevronDown, Zap } from 'lucide-react';
import api from '../services/api';
 import {TOP_STRIP_CATEGORIES2} from  "../data/categories"
import bagLogo from "../data/trend_gr_bag_icon.svg";

export default function Header() {
  
  const [active,setactive]=useState(0)
let [TOP_STRIP_CATEGORIES,setcategory]=useState(TOP_STRIP_CATEGORIES2)
    
  
 async function getCategory(){
  let  data =  await  api.get("/api/categories")
    
    console.log(data)

    setcategory(data.data)

 }
  
      useEffect(() => {
        
           getCategory()



      }, []);



  function handleCat(id){
   
    
     
      
   
  }
  
  
  return (  
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      <div className="container-page py-3 flex items-center gap-3 sm:gap-5">
        {/* Brand Wordmark */}
        <a href="/" className="flex items-center gap-2 shrink-0 group" aria-label="Trend Jr Home">
          <div className="logo-mark bg-white group-hover:scale-105 transition-transform">
            <img src={bagLogo} alt="" className="w-9 h-9" />
          </div>
          <div className="text-left leading-none">
            <div className="text-xl font-extrabold tracking-tight text-secondary">
              Trend<span className="text-primary">Jr</span>
            </div>
            <div className="eyebrow text-[10px] tracking-wider">Direct Market</div>
          </div>
        </a>

        {/* Categories Button */}
        <button
          type="button"
          className="btn-light hidden md:inline-flex gap-2 px-3.5 font-semibold shrink-0"
        >
          <LayoutGrid className="w-4 h-4 text-primary" />
          Categories
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        </button>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-2xl">
          <form className="relative flex items-center">
            <Search className="input-icon" />
            <input
              type="text"
              placeholder="Search gadgets, fashion, smart home, deals..."
              className="input-with-icon pr-24 rounded-full bg-slate-100 border-2 border-transparent focus:bg-white"
            />
            <button
              type="button"
              title="Search by image"
              className="btn-icon absolute right-11 hover:text-primary-600 hover:bg-primary-50"
              aria-label="Search by image"
            >
              <Camera className="w-4 h-4" />
            </button>
            <button
              type="submit"
              className="btn-secondary btn-sm absolute right-1.5 px-3.5 py-1.5 rounded-full"
            >
              Go
            </button>
          </form>
        </div>

        {/* Right User Actions */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {/* Account */}
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden lg:block leading-tight">
              <div className="text-[11px] text-slate-500">Hello</div>
              <div className="text-xs font-bold text-slate-900">Sign in / Register</div>
            </div>
          </button>

          {/* Wishlist */}
          <button
            type="button"
            className="relative p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
            aria-label="Wishlist"
          >
            <Heart className="w-5 h-5" />
            <span className="count-badge -top-0.5 -right-0.5">2</span>
          </button>

          {/* Cart */}
          <button
            type="button"
            className="btn-secondary gap-2.5 pl-3 pr-3.5 py-2 hover:bg-primary-600 shadow-sm"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="count-badge -top-1.5 -right-2 border-2 border-secondary">0</span>
            </div>
            <div className="hidden lg:block text-left leading-tight">
              <div className="text-[10px] font-normal text-slate-300">Cart</div>
              <div className="text-xs font-bold">Empty</div>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
