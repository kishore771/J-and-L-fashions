
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.authentication import (
    SessionAuthentication,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import WishlistItem
from .wishlist_serializers import (
    WishlistAddSerializer,
    WishlistItemSerializer,
)


class CustomerWishlistView(APIView):
    authentication_classes = [
        SessionAuthentication,
    ]

    permission_classes = [
        IsAuthenticated,
    ]

    def get(self, request):
        wishlist = (
            WishlistItem.objects
            .filter(user=request.user)
            .select_related('product')
            .prefetch_related('product__images')
        )

        serializer = WishlistItemSerializer(
            wishlist,
            many=True,
            context={'request': request},
        )

        return Response(serializer.data)

    def post(self, request):
        serializer = WishlistAddSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True
        )

        product = serializer.validated_data[
            'product'
        ]

        wishlist_item, created = (
            WishlistItem.objects.get_or_create(
                user=request.user,
                product=product,
            )
        )

        response_serializer = (
            WishlistItemSerializer(
                wishlist_item,
                context={'request': request},
            )
        )

        return Response(
            response_serializer.data,
            status=(
                status.HTTP_201_CREATED
                if created
                else status.HTTP_200_OK
            ),
        )


class CustomerWishlistDeleteView(APIView):
    authentication_classes = [
        SessionAuthentication,
    ]

    permission_classes = [
        IsAuthenticated,
    ]

    def delete(self, request, product_id):
        wishlist_item = get_object_or_404(
            WishlistItem,
            user=request.user,
            product_id=product_id,
        )

        wishlist_item.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )
