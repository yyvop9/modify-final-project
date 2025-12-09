import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import client from '@/api/client';
import { Camera, ArrowLeft, Save, Settings, LogOut } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore(); 

  // -- 🟢 상태 관리 --
  const [nickname, setNickname] = useState(user?.full_name || '');
  // previewImage: 화면에 보여줄 이미지 URL (기존 프사 or 새로 선택한 파일의 미리보기 URL)
  const [previewImage, setPreviewImage] = useState<string | null>(user?.profile_image || null);
  
  // 🔴 [추가됨] 실제 업로드할 파일 객체를 저장하는 State
  // 사용자가 파일을 선택하면 여기에 저장했다가, 저장 버튼 누를 때 서버로 보냄.
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -- 🔵 핸들러 함수들 --

  // 📸 이미지 선택 시 실행 (미리보기 + 파일 저장)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. 화면 표시용 (미리보기 URL 생성) - 즉시 보여줌
      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl);
      
      // 2. 🔴 실제 파일 객체 저장 (나중에 업로드용)
      setSelectedFile(file);
    }
  };

  // 💾 [저장하기] 버튼 클릭 시 실행 (핵심 로직!)
  const handleSave = async () => {
    if (!nickname.trim()) return alert("닉네임을 입력해주세요.");
    setIsLoading(true);

    try {
      let finalImageUrl = user?.profile_image; // 기본값: 기존 이미지 유지

      // 🔴 1. 새 이미지를 선택했다면? -> 먼저 서버로 업로드!
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        // 백엔드 업로드 API 호출 (아까 만든 upload.py)
        // /api/v1/utils/upload/image 주소로 요청 보냄
        const uploadRes = await client.post('/utils/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        // 업로드 성공! 서버가 알려준 이미지 주소(URL)를 받음
        finalImageUrl = uploadRes.data.url;
      }

      // 🔴 2. 프로필 정보 업데이트 (PATCH)
      // 닉네임과 (바꼈다면) 새 이미지 URL을 백엔드에 저장 요청
      const response = await client.patch('/users/me', {
        full_name: nickname,
        profile_image: finalImageUrl 
      });

      // 3. 스토어 업데이트 및 알림
      setUser(response.data); 
      alert("프로필이 수정되었습니다! ✨");
      // navigate(-1); // 저장 후 뒤로가기 (선택사항)

    } catch (error) {
      console.error(error);
      alert("수정에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-6">
      
      {/* 뒤로가기 버튼 */}
      <div className="w-full max-w-[480px] mb-4">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={20} className="mr-1" /> 홈으로
        </button>
      </div>

      {/* 🪪 프로필 카드 */}
      <div className="w-full max-w-[480px] bg-white rounded-[32px] shadow-xl p-8 border border-gray-100 relative overflow-hidden">
        
        {/* 상단 배경 장식 */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-[#7A51A1] to-[#5D93D0] opacity-10"></div>

        <div className="relative flex flex-col items-center mt-4">
          
          <h2 className="text-2xl font-bold text-gray-800 mb-8">프로필 편집</h2>

          {/* 🖼️ 프사 영역 */}
          <div className="relative group mb-8">
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100 flex items-center justify-center">
              {/* 이미지가 있으면 이미지 표시, 없으면 이니셜 표시 */}
              {previewImage ? (
                <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-gray-300">
                  {user?.email?.[0].toUpperCase() || 'M'}
                </span>
              )}
            </div>

            {/* 카메라 버튼 */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-10 h-10 bg-[#7A51A1] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#6941C6] transition-all hover:scale-110 border-2 border-white"
            >
              <Camera size={18} />
            </button>
            
            {/* 숨겨진 파일 인풋 (실제 파일 선택 창) */}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageChange} 
            />
          </div>

          {/* 📝 닉네임 입력 폼 */}
          <div className="w-full space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600 ml-1">닉네임</label>
              <input 
                type="text" 
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full h-[54px] px-5 bg-[#F2F4F7] border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#7A51A1] outline-none transition-all text-gray-800 font-medium text-lg text-center"
                placeholder="닉네임을 입력하세요"
              />
              <p className="text-xs text-center text-gray-400">다른 사용자에게 표시되는 이름입니다.</p>
            </div>

            {/* 이메일 (수정 불가) */}
            <div className="space-y-2 opacity-60">
              <label className="text-sm font-bold text-gray-500 ml-1">계정 (이메일)</label>
              <div className="w-full h-[54px] px-5 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500 font-medium">
                {user?.email}
              </div>
            </div>
          </div>

          {/* 저장 버튼 */}
          <button 
            onClick={handleSave}
            disabled={isLoading}
            className="w-full h-[54px] mt-8 bg-gradient-to-r from-[#7A51A1] to-[#5D93D0] hover:opacity-90 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? (
              '저장 중...'
            ) : (
              <>
                <Save size={20} />
                저장하기
              </>
            )}
          </button>

          {/* 👇 계정 설정으로 가는 버튼들 */}
          <div className="w-full mt-8 pt-8 border-t border-gray-100 space-y-3">
            <p className="text-xs text-gray-400 font-medium ml-2 mb-2">계정 관리</p>
            
            <button 
              onClick={() => navigate('/account')} 
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-500 shadow-sm group-hover:text-[#7A51A1]">
                  <Settings size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-700">계정 및 보안 설정</p>
                  <p className="text-xs text-gray-400">비밀번호 변경, 전화번호 관리</p>
                </div>
              </div>
              <ArrowLeft size={18} className="text-gray-300 rotate-180" />
            </button>

            <button 
              onClick={() => { logout(); navigate('/login'); }}
              className="w-full flex items-center justify-center p-3 text-red-500 text-sm font-medium hover:bg-red-50 rounded-xl transition-colors"
            >
              <LogOut size={16} className="mr-2" /> 로그아웃
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}