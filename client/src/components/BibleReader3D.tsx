// client/src/components/BibleReader3D.tsx
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useQuery } from '@tanstack/react-query';

interface Reader {
  id: string;
  name: string;
  cssClass: string;
}

interface Verse {
  number: number;
  text: string;
  assignedReader?: string;
}

interface Chapter {
  title: string;
  verses: Verse[];
}

interface BibleData {
  [book: string]: {
    [chapter: number]: Chapter;
  };
}

const BibleReader3D: React.FC = () => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [currentBook, setCurrentBook] = useState('genesis');
  const [currentChapter, setCurrentChapter] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [assignMode, setAssignMode] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<string | null>(null);
  const [showReaderModal, setShowReaderModal] = useState(false);
  const [verseAssignments, setVerseAssignments] = useState<Record<string, string>>({});
  const [totalPages, setTotalPages] = useState(1);

  // Fetch Bible data from your API
  const { data: bibleData, isLoading } = useQuery<BibleData>({
    queryKey: ['bible-data', currentBook, currentChapter],
    queryFn: async () => {
      const response = await fetch(`/api/bible/${currentBook}/${currentChapter}`);
      if (!response.ok) {
        throw new Error('Failed to fetch bible data');
      }
      return response.json();
    }
  });

  // Fetch reader assignments
  const { data: assignments } = useQuery({
    queryKey: ['reader-assignments'],
    queryFn: async () => {
      const response = await fetch('/api/reader-assignments');
      if (!response.ok) {
        throw new Error('Failed to fetch assignments');
      }
      return response.json();
    }
  });

  const readers: Reader[] = [
    { id: 'maria', name: 'María González', cssClass: 'reader-maria' },
    { id: 'juan', name: 'Juan Pérez', cssClass: 'reader-juan' },
    { id: 'ana', name: 'Ana López', cssClass: 'reader-ana' },
    { id: 'carlos', name: 'Carlos Ruiz', cssClass: 'reader-carlos' },
    { id: 'isabel', name: 'Isabel Torres', cssClass: 'reader-isabel' },
    { id: 'miguel', name: 'Miguel Santos', cssClass: 'reader-miguel' },
    { id: 'carmen', name: 'Carmen Vega', cssClass: 'reader-carmen' },
    { id: 'roberto', name: 'Roberto Silva', cssClass: 'reader-roberto' }
  ];

  useEffect(() => {
    if (assignments) {
      setVerseAssignments(assignments);
    }
  }, [assignments]);

  useEffect(() => {
    if (sceneRef.current && !isLoading) {
      initThreeJS();
    }
  }, [isLoading]);

  const initThreeJS = () => {
    if (!sceneRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      sceneRef.current.clientWidth / sceneRef.current.clientHeight,
      0.1,
      1000
    );
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(sceneRef.current.clientWidth, sceneRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    sceneRef.current.appendChild(renderer.domElement);

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffd700, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(8, 12, 8);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create 3D book
    createBook(scene);
    
    camera.position.set(0, 2, 8);
    camera.lookAt(0, 0, 0);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      if (sceneRef.current && renderer.domElement) {
        sceneRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  };

  const createBook = (scene: THREE.Scene) => {
    const bookGroup = new THREE.Group();

    // Book spine
    const spineGeometry = new THREE.BoxGeometry(6, 0.8, 0.3);
    const spineMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x4a2c17,
      shininess: 30
    });
    const bookSpine = new THREE.Mesh(spineGeometry, spineMaterial);
    bookSpine.position.z = -1.85;
    bookGroup.add(bookSpine);

    // Pages with curvature
    for (let i = 0; i < 25; i++) {
      const page = createCurvedPage(0.25 + (i * 0.015));
      bookGroup.add(page);
    }

    // Covers
    const coverGeometry = new THREE.BoxGeometry(6.2, 0.15, 4.2);
    const coverMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x2d1810,
      shininess: 50
    });
    
    const topCover = new THREE.Mesh(coverGeometry, coverMaterial);
    topCover.position.y = 0.75;
    bookGroup.add(topCover);

    bookGroup.position.y = -1;
    bookGroup.rotation.x = -0.15;
    scene.add(bookGroup);
  };

  const createCurvedPage = (yPos: number) => {
    const geometry = new THREE.PlaneGeometry(5.8, 3.8, 32, 32);
    const vertices = geometry.attributes.position.array;
    
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const z = vertices[i + 2];
      
      const curveX = Math.pow(Math.abs(x) / 2.9, 2) * 0.1;
      vertices[i + 1] += curveX;
    }
    
    geometry.computeVertexNormals();
    
    const material = new THREE.MeshPhongMaterial({ 
      color: 0xf8f5e4,
      side: THREE.DoubleSide,
      shininess: 10
    });
    
    const page = new THREE.Mesh(geometry, material);
    page.position.y = yPos;
    page.rotation.x = -Math.PI / 2;
    
    return page;
  };

  const handleVerseClick = (verseKey: string) => {
    if (assignMode) {
      setSelectedVerse(verseKey);
      setShowReaderModal(true);
    }
  };

  const assignReader = async (readerId: string) => {
    if (!selectedVerse) return;

    const newAssignments = { ...verseAssignments, [selectedVerse]: readerId };
    setVerseAssignments(newAssignments);

    // Save to API
    try {
      await fetch('/api/reader-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verseKey: selectedVerse, readerId })
      });
    } catch (error) {
      console.error('Failed to save assignment:', error);
    }

    setShowReaderModal(false);
    setSelectedVerse(null);
  };

  const renderVerses = (verses: Verse[], startIndex: number, endIndex: number) => {
    return verses.slice(startIndex, endIndex).map((verse, index) => {
      const verseKey = `${currentBook}-${currentChapter}-${verse.number}`;
      const assignedReaderId = verseAssignments[verseKey];
      const reader = readers.find(r => r.id === assignedReaderId);

      return (
        <div
          key={verse.number}
          className={`verse ${reader ? reader.cssClass : ''}`}
          onClick={() => handleVerseClick(verseKey)}
          title={reader ? reader.name : undefined}
        >
          <span className="verse-number">{verse.number}</span>
          <span className="verse-text">{verse.text}</span>
        </div>
      );
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white text-xl">Cargando Sagrada Escritura...</div>
      </div>
    );
  }

  const currentChapterData = bibleData?.[currentBook]?.[currentChapter];
  if (!currentChapterData) return null;

  const versesPerPage = 16;
  const startVerse = currentPage * versesPerPage;
  const endVerse = Math.min(startVerse + versesPerPage, currentChapterData.verses.length);
  const midPoint = Math.ceil((endVerse - startVerse) / 2) + startVerse;

  return (
    <div className="bible-reader-container">
      {/* Styles */}
      <style jsx>{`
        .bible-reader-container {
          position: relative;
          width: 100vw;
          height: 100vh;
          background: linear-gradient(135deg, #2c1810, #1a0f08);
          overflow: hidden;
        }

        .book-container {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .book {
          position: relative;
          width: 85vw;
          height: 80vh;
          max-width: 1200px;
          max-height: 800px;
        }

        .page {
          position: absolute;
          width: 50%;
          height: 100%;
          background: linear-gradient(145deg, #ffffff, #f8f8f8);
          border: 1px solid #e0e0e0;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          border-radius: 8px;
        }

        .page-left {
          left: 0;
          border-radius: 8px 0 0 8px;
        }

        .page-right {
          right: 0;
          border-radius: 0 8px 8px 0;
        }

        .page-content {
          padding: 40px 35px;
          height: 100%;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .chapter-header {
          text-align: center;
          margin-bottom: 25px;
          padding-bottom: 12px;
          border-bottom: 1px solid #8b0000;
        }

        .book-title {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 600;
          color: #8b0000;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .chapter-title {
          font-family: 'Playfair Display', serif;
          font-size: 14px;
          font-weight: 500;
          color: #2c1810;
          font-style: italic;
        }

        .verses-container {
          flex: 1;
          columns: 2;
          column-gap: 20px;
          text-align: justify;
          line-height: 1.3;
          font-size: 13px;
          color: #2c1810;
        }

        .verse {
          margin-bottom: 6px;
          break-inside: avoid;
          padding: 3px 6px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .verse:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }

        .verse-number {
          font-weight: 600;
          color: #8b0000;
          font-size: 11px;
          vertical-align: super;
          margin-right: 4px;
        }

        /* Reader colors */
        .reader-maria { background: rgba(255, 182, 193, 0.4); }
        .reader-juan { background: rgba(173, 216, 230, 0.4); }
        .reader-ana { background: rgba(144, 238, 144, 0.4); }
        .reader-carlos { background: rgba(255, 215, 0, 0.4); }
        .reader-isabel { background: rgba(221, 160, 221, 0.4); }
        .reader-miguel { background: rgba(255, 255, 224, 0.5); }
        .reader-carmen { background: rgba(255, 160, 122, 0.4); }
        .reader-roberto { background: rgba(176, 196, 222, 0.4); }

        .controls {
          position: fixed;
          top: 30px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 15px;
          z-index: 2000;
        }

        .control-btn {
          padding: 8px 15px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #8b0000;
          border-radius: 20px;
          color: #8b0000;
          font-weight: 500;
          cursor: pointer;
          font-size: 12px;
        }

        .assign-btn {
          position: fixed;
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
          background: linear-gradient(135deg, #8b0000, #5c0000);
          color: white;
          border: none;
          border-radius: 20px;
          padding: 12px 16px;
          cursor: pointer;
          font-weight: 500;
          font-size: 12px;
          z-index: 2000;
        }

        .assign-btn.active {
          background: linear-gradient(135deg, #7ed321, #4a7c59);
        }

        .modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3000;
        }

        .modal-content {
          background: white;
          border-radius: 15px;
          padding: 25px;
          max-width: 350px;
          width: 90%;
        }

        .readers-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin: 15px 0;
        }

        .reader-option {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          text-align: center;
        }

        .reader-option:hover {
          border-color: #8b0000;
        }
      `}</style>

      {/* Navigation */}
      <div className="controls">
        <select 
          className="control-btn"
          value={currentBook}
          onChange={(e) => setCurrentBook(e.target.value)}
        >
          <option value="genesis">Génesis</option>
          <option value="exodus">Éxodo</option>
          <option value="matthew">Mateo</option>
        </select>
        
        <select 
          className="control-btn"
          value={currentChapter}
          onChange={(e) => setCurrentChapter(Number(e.target.value))}
        >
          <option value="1">Capítulo 1</option>
          <option value="2">Capítulo 2</option>
        </select>
      </div>

      {/* Assignment button */}
      <button 
        className={`assign-btn ${assignMode ? 'active' : ''}`}
        onClick={() => setAssignMode(!assignMode)}
      >
        {assignMode ? '✅ Activo' : '📝 Asignar'}
      </button>

      {/* 3D Scene */}
      <div ref={sceneRef} className="book-container" />

      {/* Book pages */}
      <div className="book">
        <div className="page page-left">
          <div className="page-content">
            <div className="chapter-header">
              <div className="book-title">Génesis</div>
              <div className="chapter-title">{currentChapterData.title}</div>
            </div>
            <div className="verses-container">
              {renderVerses(currentChapterData.verses, startVerse, midPoint)}
            </div>
          </div>
        </div>

        <div className="page page-right">
          <div className="page-content">
            <div className="chapter-header">
              <div className="book-title">Génesis</div>
              <div className="chapter-title">{currentChapterData.title} (cont.)</div>
            </div>
            <div className="verses-container">
              {renderVerses(currentChapterData.verses, midPoint, endVerse)}
            </div>
          </div>
        </div>
      </div>

      {/* Reader selection modal */}
      {showReaderModal && (
        <div className="modal">
          <div className="modal-content">
            <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>
              Seleccionar Lector
            </h3>
            <div className="readers-grid">
              {readers.map(reader => (
                <div
                  key={reader.id}
                  className="reader-option"
                  onClick={() => assignReader(reader.id)}
                >
                  {reader.name}
                </div>
              ))}
            </div>
            <button 
              className="control-btn"
              style={{ width: '100%', marginTop: '10px' }}
              onClick={() => setShowReaderModal(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BibleReader3D;