
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from .serializers import ContactMessageSerializer


class ContactMessageThrottle(AnonRateThrottle):
    scope = "contact"

    rate = "5/hour"


class ContactMessageView(APIView):

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ContactMessageThrottle]

    def post(self, request):

        serializer = ContactMessageSerializer(
            data=request.data
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save()

        return Response(
            {
                "message": (
                    "Your message has been sent successfully. "
                    "We'll get back to you soon."
                )
            },
            status=status.HTTP_201_CREATED,
        )
