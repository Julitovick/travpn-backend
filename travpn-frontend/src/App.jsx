import React, { useState, useEffect } from 'react';
import { Search, Plane, Calendar, ArrowRight, MapPin, Globe, Info, X, Check, Shield } from 'lucide-react';


  // URL DE TU BACKEND EN HOSTINGER
  // Cuando estés desarrollando en tu PC, usa 'http://localhost:3000/api/search'
  // Cuando subas la web, usa tu dominio real, ej: 'https://api.travpn.com/api/search' o la IP de tu VPS
  const API_URL = 'https://travpn-backend.onrender.com/api/search'; 

  // Sustituye la función handleSearch anterior por esta:
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!formData.origin || !formData.destination || !formData.departDate) return;

    setLoading(true);
    setResults(null);

    try {
      // Llamamos a TU servidor backend real en Hostinger
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: formData.origin,       // ej: "MAD"
          destination: formData.destination, // ej: "JFK"
          date: formData.departDate      // ej: "2024-10-10"
        })
      });

      const data = await response.json();

      // Procesar los datos reales para mostrarlos
      // (Asumiendo que el backend ya devuelve el formato correcto)
      // Necesitarás lógica para convertir monedas aquí si el backend no lo hizo
      
      setResults(data); // Guardamos los datos REALES

    } catch (error) {
      console.error("Error conectando con el servidor:", error);
      alert("Hubo un error buscando los vuelos. Verifica que el servidor Backend esté activo.");
    } finally {
      setLoading(false);
    }
  };

  const openTutorial = (deal) => {