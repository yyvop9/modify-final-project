import React from 'react';
import { useQuery } from '@tanstack/react-query';
import client from '../../api/client';
import Modal from '../ui/Modal';
import ProductCard from './ProductCard';
import { Heart, Loader2, ShoppingBag } from 'lucide-react';

interface WishlistModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function WishlistModal({ isOpen, onClose }: WishlistModalProps) {
    // 위시리스트 데이터 가져오기
    const { data: products, isLoading, refetch } = useQuery({
        queryKey: ['my-wishlist'],
        queryFn: async () => {
            const res = await client.get('/wishlist/');
            return res.data;
        },
        enabled: isOpen, // 모달이 열릴 때만 데이터 로딩
    });

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={
                <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500 fill-current" /> 
                    <span>My Wishlist</span>
                </div>
            }
            maxWidth="max-w-5xl"
        >
            <div className="min-h-[300px]">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                ) : !products || products.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-64 text-gray-400 gap-4">
                        <ShoppingBag className="w-16 h-16 opacity-20" />
                        <p>아직 찜한 상품이 없습니다.</p>
                        <button onClick={onClose} className="text-sm text-indigo-600 font-bold hover:underline">
                            쇼핑하러 가기
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
                        {products.map((product: any) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
}