
import React, { useState, useEffect, CSSProperties, useRef } from 'react';
import { Document, Packer, Paragraph, HeadingLevel, AlignmentType } from 'docx';
import type { HealthTopicInfo } from './types';
import { fetchHealthInfo } from './services/geminiService';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import SectionCard from './components/SectionCard';

// Icons as React Components
const icons = {
  mainTopic: <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
  </svg>,
  info: <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 4a1 1 0 100 2h8a1 1 0 100-2H6zm0 4a1 1 0 100 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
  </svg>,
  search: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>,
  heart: <svg xmlns="http://www.w3.org/2000/svg" className="w-24 h-24 text-red-500 animate-beat" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
  </svg>,
  download: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
};

type Audience = 'public' | 'professional';

const App: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [audience, setAudience] = useState<Audience>('public');
  const [healthInfo, setHealthInfo] = useState<HealthTopicInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const searchIdRef = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => {
        setCurrentDate(new Date());
    }, 1000); // Update every second

    return () => {
        clearInterval(timer); // Cleanup on component unmount
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setError("لطفاً یک موضوع سلامتی را وارد کنید.");
      return;
    }

    const currentSearchId = ++searchIdRef.current;
    
    setIsLoading(true);
    setError(null);
    setHealthInfo(null);
    try {
      const data = await fetchHealthInfo(query, audience);
      if (searchIdRef.current === currentSearchId) {
        setHealthInfo(data);
      }
    } catch (err: any) {
      if (searchIdRef.current === currentSearchId) {
        setError(err.message || "مشکلی در دریافت اطلاعات پیش آمد. لطفاً دوباره تلاش کنید.");
      }
    } finally {
      if (searchIdRef.current === currentSearchId) {
        setIsLoading(false);
      }
    }
  };
  
  const handleCancelSearch = () => {
    searchIdRef.current++; // Invalidate the current search
    setIsLoading(false);
    setError(null);
  };

  const handleDownload = () => {
    if (!healthInfo) return;

    const children = [
        new Paragraph({ text: healthInfo.topicName, style: "rtlHeading1" }),
        new Paragraph({ text: healthInfo.introduction, style: "rtlStyle" }),
    ];

    healthInfo.sections.forEach(section => {
        children.push(new Paragraph({ text: section.title, style: "rtlHeading2" }));
        section.details.forEach(detail => {
            children.push(new Paragraph({
                text: detail,
                numbering: { reference: "rtl-bullet-points", level: 0 },
                style: "rtlStyle",
            }));
        });
    });

    const doc = new Document({
        creator: "Hooshyar Health Assistant",
        title: healthInfo.topicName,
        description: `Information about ${healthInfo.topicName}`,
        styles: {
            paragraphStyles: [
                {
                    id: "rtlStyle",
                    name: "RTL Style",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: { font: "Vazirmatn", size: 24, rightToLeft: true },
                    paragraph: { alignment: AlignmentType.RIGHT, spacing: { after: 120 } },
                },
                 {
                    id: "rtlHeading1",
                    name: "RTL Heading 1",
                    basedOn: "Heading1",
                    next: "Normal",
                    quickFormat: true,
                    run: { font: "Vazirmatn", size: 40, bold: true, rightToLeft: true },
                    paragraph: { alignment: AlignmentType.CENTER, spacing: { after: 240 } },
                },
                 {
                    id: "rtlHeading2",
                    name: "RTL Heading 2",
                    basedOn: "Heading2",
                    next: "Normal",
                    quickFormat: true,
                    run: { font: "Vazirmatn", size: 32, bold: true, rightToLeft: true },
                    paragraph: { alignment: AlignmentType.RIGHT, spacing: { before: 240, after: 120 } },
                },
            ],
        },
         numbering: {
            config: [
                {
                    reference: "rtl-bullet-points",
                    levels: [
                        {
                            level: 0,
                            format: "bullet",
                            text: "\u2022",
                            alignment: AlignmentType.RIGHT,
                            style: {
                                paragraph: { indent: { left: 720, hanging: 360 } },
                                run: { rightToLeft: true },
                            },
                        },
                    ],
                },
            ],
        },
        sections: [{
            properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
            children: children,
        }],
    });

    Packer.toBlob(doc).then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style.display = "none";
        a.href = url;
        const safeFileName = healthInfo.topicName.replace(/[\\/:*?"<>|]/g, '_');
        a.download = `${safeFileName}.docx`;
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    });
  };

  const downloadAction = (
    <button
      onClick={handleDownload}
      className="flex items-center gap-2 py-2 px-3 text-indigo-600 hover:text-purple-700 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-all duration-300 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
      title="دانلود به صورت فایل Word"
      aria-label="دانلود فایل Word"
    >
      {icons.download}
      <span className="font-medium text-sm hidden sm:inline">دانلود بصورت Word</span>
    </button>
  );

  const downloadButton = (
    <button
      onClick={handleDownload}
      className="flex items-center bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold py-3 px-8 rounded-full hover:from-indigo-600 hover:to-purple-600 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-indigo-500/50 transition-all duration-300 transform hover:scale-105 shadow-lg"
      aria-label="دانلود اطلاعات به صورت فایل Word"
    >
      <span className="mr-2">{icons.download}</span>
      <span>دانلود بصورت Word</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-white">
      <header className="bg-gradient-to-r from-indigo-600 to-purple-700 fixed top-0 w-full z-10 shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-white">هوش یار</h1>
            <p className="text-indigo-200 mt-2 text-lg">من هوش یار هستم هر سوالی داری این پایین از من بپرس</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8 pt-36 pb-20">
        <div className="max-w-2xl mx-auto relative bg-white/70 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-xl mb-4 border border-white/50">
          <form onSubmit={handleSubmit}>
            <div className="mb-6 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/70">
              <label className="block text-lg font-semibold text-gray-800 mb-3 text-center">
                سطح اطلاعات مورد نیاز:
              </label>
              <div className="flex w-full max-w-sm mx-auto items-center justify-center gap-2 rounded-full bg-white p-1.5 shadow-inner border border-gray-200/80">
                <button
                  type="button"
                  onClick={() => setAudience('public')}
                  className={`w-full py-2.5 px-4 rounded-full text-center font-semibold transition-all duration-300 ${
                    audience === 'public'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : 'bg-transparent text-gray-600 hover:bg-indigo-100/50'
                  }`}
                  aria-pressed={audience === 'public'}
                >
                  عموم مردم
                </button>
                <button
                  type="button"
                  onClick={() => setAudience('professional')}
                  className={`w-full py-2.5 px-4 rounded-full text-center font-semibold transition-all duration-300 ${
                    audience === 'professional'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : 'bg-transparent text-gray-600 hover:bg-indigo-100/50'
                  }`}
                   aria-pressed={audience === 'professional'}
                >
                  کادر درمان
                </button>
              </div>
            </div>

            <label htmlFor="topic-search" className="sr-only">
              موضوع سلامت مورد نظر خود را وارد کنید:
            </label>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="relative flex-grow w-full">
                 <span className="absolute top-3.5 right-0 flex items-center pr-4 pointer-events-none">
                  {icons.search}
                </span>
                <textarea
                  id="topic-search"
                  rows={3}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="مثلاً: دیابت، مراقبت از زخم بستر، اکسیژن تراپی"
                  className="w-full py-3 pr-12 pl-4 text-lg text-gray-800 bg-white/80 border border-gray-300/70 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all shadow-inner resize-y"
                />
              </div>
              <div className="flex flex-col gap-3 w-full sm:w-auto">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3.5 px-8 rounded-full hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-indigo-500/50 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  {isLoading ? 'در حال جستجو...' : 'بپرس'}
                </button>
                 {isLoading && (
                    <button
                    onClick={handleCancelSearch}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 px-8 rounded-full transition-all duration-300 shadow-md transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-500/50"
                    aria-label="توقف جستجو"
                    >
                    توقف جستجو
                    </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {isLoading && <LoadingSpinner />}
        {error && <ErrorMessage message={error} />}

        {healthInfo && (
          <div className="space-y-6 staggered-fade-in">
            <div style={{'--stagger-index': 0} as CSSProperties}>
                <SectionCard
                    title={healthInfo.topicName}
                    icon={icons.mainTopic}
                    actions={downloadAction}
                >
                    <p className="text-lg">{healthInfo.introduction}</p>
                </SectionCard>
            </div>
            
            {healthInfo.sections.map((section, index) => (
              <div key={index} style={{'--stagger-index': index + 1} as CSSProperties}>
                <SectionCard
                  title={section.title}
                  icon={icons.info}
                >
                  <ul className="list-disc list-inside space-y-2">
                    {section.details.map((detail, detailIndex) => (
                      <li key={detailIndex}>{detail}</li>
                    ))}
                  </ul>
                </SectionCard>
              </div>
            ))}
            
            {healthInfo && (
                <div className="flex justify-center mt-8" style={{'--stagger-index': healthInfo.sections.length + 1} as CSSProperties}>
                    {downloadButton}
                </div>
            )}
          </div>
        )}

        {!isLoading && !healthInfo && !error && (
            <div className="text-center mt-12 p-8 bg-white/50 rounded-3xl shadow-lg border border-white/50">
                <div className="flex justify-center items-center mb-4">
                    {icons.heart}
                </div>
                <h2 className="text-3xl font-bold text-gray-800">به هوش یار خوش آمدید</h2>
                <p className="text-gray-600 mt-2 text-lg">دستیار سلامت هوشمند شما، آماده پاسخگویی به سوالاتتان است.</p>
                <p className="text-gray-500 mt-4 text-sm">
                    تاریخ و ساعت فعلی: {currentDate.toLocaleDateString('fa-IR')} - {currentDate.toLocaleTimeString('fa-IR')}
                </p>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;
