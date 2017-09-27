import cv2

img1 = cv2.imread('img1.png')
img2 = cv2.imread('img2.png')

akaze = cv2.AKAZE_create()
kp1, des1 = akaze.detectAndCompute(img1, None)
kp2, des2 = akaze.detectAndCompute(img2, None)
bf = cv2.BFMatcher(2)
matches = bf.knnMatch(des1, des2, k=2)
ratio = 0.5
good = []
for m, n in matches:
    if m.distance < ratio * n.distance:
        good.append([m])
mathching_img = cv2.drawMatchesKnn(img1, kp1, img2, kp2, good, None, flags = 2)

cv2.imwrite('out.png', mathching_img)
