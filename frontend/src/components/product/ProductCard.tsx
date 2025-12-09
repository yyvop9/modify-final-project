import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import client from '../../api/client';

interface Product {
    id: number;
    name: string;
    category: string;
    price: number;
    image_url: string;
}

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isWished, setIsWished] = useState(false);

    // =================================================================
    // 🕵️‍♀️ [DEBUG] 이미지 주소 정규화 및 로그 출력
    // =================================================================
    const getImageUrl = (url: string) => {
        if (!url) {
            // DB에 이미지 주소가 아예 없는 경우
            // console.log(`[ProductCard] ${product.name}: URL 없음 -> placeholder 사용`);
            return "/placeholder.png";
        }
        
        // 1. 이미 완전한 URL인 경우 (http로 시작) -> 그대로 사용
        if (url.startsWith("http")) {
            // console.log(`[ProductCard] ${product.name}: 전체 URL 감지 -> ${url}`);
            return url;
        }
        
        // 2. 상대 경로인 경우 (/static으로 시작) -> 백엔드 주소(localhost:8000) 붙이기
        // TODO: 배포 환경에서는 이 부분을 환경변수(import.meta.env.VITE_API_URL)로 교체해야 합니다.
        const BACKEND_URL = "http://localhost:8000"; 
        
        const cleanUrl = url.startsWith("/") ? url : `/${url}`;
        const fullUrl = `${BACKEND_URL}${cleanUrl}`;
        
        // console.log(`[ProductCard] ${product.name}: 상대 경로 감지 -> ${fullUrl} 로 변환됨`);
        return fullUrl;
    };

    const displayImage = getImageUrl(product.image_url);
    // =================================================================

    // 1. 초기 찜 상태 확인
    const { data: wishStatus } = useQuery({
        queryKey: ['wishlist-status', product.id],
        queryFn: async () => {
            try {
                const res = await client.get(`/wishlist/check/${product.id}`);
                return res.data;
            } catch {
                return { is_wished: false };
            }
        },
    });

    useEffect(() => {
        if (wishStatus) setIsWished(wishStatus.is_wished);
    }, [wishStatus]);

    // 2. 찜 토글 Mutation
    const toggleWishlistMutation = useMutation({
        mutationFn: async () => {
            const res = await client.post(`/wishlist/toggle/${product.id}`);
            return res.data;
        },
        onSuccess: (data) => {
            setIsWished(data.is_wished);
            queryClient.invalidateQueries({ queryKey: ['my-wishlist'] });
            queryClient.invalidateQueries({ queryKey: ['wishlist-status', product.id] });
        },
        onError: () => {
            alert("로그인이 필요합니다.");
        }
    });

    const handleToggleWishlist = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlistMutation.mutate();
    };

    return (
        <div className="group relative">
            {/* 상품 이미지 카드 */}
            <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800 relative cursor-pointer" onClick={() => navigate(`/products/${product.id}`)}>
                <img
                    src={displayImage}
                    alt={product.name}
                    className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    
                    // 🕵️‍♀️ [DEBUG] 에러 발생 시 상세 로그 출력
                    onError={(e) => {
                        const imgElement = e.currentTarget;
                        
                        // 무한 루프 방지: 이미 placeholder인데 또 에러나면 중단
                        if (imgElement.src.includes("placeholder.png")) {
                            console.error(`[ProductCard] ${product.name}: placeholder 이미지조차 로드 실패! (경로 확인 필요: /placeholder.png)`);
                            return;
                        }

                        console.error(`[ProductCard] 이미지 로드 실패!`, {
                            상품명: product.name,
                            시도한URL: imgElement.src,
                            DB원본URL: product.image_url,
                            조치: "placeholder 이미지로 교체합니다."
                        });
                        
                        // placeholder 이미지로 교체
                        imgElement.src = "/placeholder.png";
                    }}
                />
                
                {/* 💖 하트 버튼 */}
                <button 
                    onClick={handleToggleWishlist}
                    className="absolute top-3 right-3 p-2 bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 transition-colors shadow-sm"
                >
                    <Heart className={`w-4 h-4 ${isWished ? 'fill-red-500 text-red-500' : ''}`} />
                </button>

                {/* 장바구니 버튼 */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            alert("상세 페이지에서 옵션을 선택해주세요.");
                            navigate(`/products/${product.id}`);
                        }}
                        className="p-3 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-lg hover:scale-110 transition-transform"
                    >
                        <ShoppingBag className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* 상품 정보 */}
            <div className="mt-3 space-y-1 cursor-pointer" onClick={() => navigate(`/products/${product.id}`)}>
                <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                    {product.category || "Uncategorized"}
                </p>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1 group-hover:text-purple-600 transition-colors">
                    {product.name}
                </h3>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-200">
                    {product.price?.toLocaleString()}원
                </p>
            </div>
        </div>
    );
}