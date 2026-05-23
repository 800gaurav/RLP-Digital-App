import React, { useEffect, useRef, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Colors } from '../../constants/colors';
import { FontFamily } from '../../constants/typography';

export default function ReelViewer({
  reel,
  visible,
  onClose,
  onDownload,
  hasNext = false,
  hasPrevious = false,
  currentIndex = 0,
  totalCount = 1,
  onNext,
  onPrevious,
}) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    setIsPlaying(true);
  }, [reel?.id]);

  const handlePlaybackStatusUpdate = (status) => {
    if (status.isLoaded) setIsPlaying(status.isPlaying);
  };

  const togglePlayPause = async () => {
    if (!videoRef.current) return;
    if (isPlaying) await videoRef.current.pauseAsync();
    else await videoRef.current.playAsync();
  };

  const handlePrevious = () => {
    if (hasPrevious && onPrevious) onPrevious();
  };

  const handleNext = () => {
    if (hasNext && onNext) onNext();
  };

  if (!reel) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        {reel.mediaType === 'video' ? (
          <View style={styles.mediaContainer}>
            <Video
              ref={videoRef}
              source={{ uri: reel.videoUrl || reel.mediaUrl }}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              isMuted
              isLooping
              usePoster={Boolean(reel.thumbnailUrl)}
              posterSource={reel.thumbnailUrl ? { uri: reel.thumbnailUrl } : undefined}
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            />
            <Pressable style={styles.playPauseOverlay} onPress={togglePlayPause} accessibilityRole="button" accessibilityLabel="Play or pause">
              <View style={styles.playPauseCircle}>
                <Text style={styles.playPauseIcon}>{isPlaying ? 'Pause' : 'Play'}</Text>
              </View>
            </Pressable>
          </View>
        ) : (
          <View style={styles.mediaContainer}>
            <Image source={{ uri: reel.imageUrl || reel.mediaUrl }} style={styles.image} resizeMode="contain" accessibilityLabel={reel.caption} />
          </View>
        )}

        <View style={styles.tapZones} pointerEvents="box-none">
          <Pressable
            style={styles.tapZone}
            onPress={handlePrevious}
            disabled={!hasPrevious}
            accessibilityRole="button"
            accessibilityLabel="Previous status"
          />
          <Pressable
            style={styles.tapZone}
            onPress={handleNext}
            disabled={!hasNext}
            accessibilityRole="button"
            accessibilityLabel="Next status"
          />
        </View>

        {totalCount > 1 ? (
          <View style={styles.progressRow} pointerEvents="none">
            {Array.from({ length: totalCount }).map((_, index) => (
              <View
                key={index}
                style={[styles.progressSegment, index <= currentIndex && styles.progressSegmentActive]}
              />
            ))}
          </View>
        ) : null}

        {reel.caption ? (
          <View style={styles.captionContainer}>
            <Text style={styles.caption}>{reel.caption}</Text>
          </View>
        ) : null}

        <Pressable
          style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close viewer"
        >
          <Text style={styles.closeIcon}>X</Text>
        </Pressable>

        <View style={styles.downloadContainer}>
          <Pressable
            style={({ pressed }) => [styles.downloadButton, pressed && styles.downloadButtonPressed]}
            onPress={() => onDownload(reel)}
            accessibilityRole="button"
            accessibilityLabel="Download media"
          >
            <Text style={styles.downloadText}>Download</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.black },
  mediaContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  video: { width: '100%', height: '100%' },
  image: { width: '100%', height: '100%' },
  playPauseOverlay: {
    position: 'absolute',
    top: '36%',
    bottom: '36%',
    left: '34%',
    right: '34%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  playPauseCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  playPauseIcon: { fontFamily: FontFamily.semiBold, fontSize: 12, color: Colors.white },
  tapZones: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 2 },
  tapZone: { flex: 1 },
  progressRow: { position: 'absolute', top: 38, left: 8, right: 8, flexDirection: 'row', gap: 5, zIndex: 4 },
  progressSegment: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.28)' },
  progressSegmentActive: { backgroundColor: 'rgba(255,255,255,0.9)' },
  captionContainer: { position: 'absolute', bottom: 100, left: 0, right: 0, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 4 },
  caption: { fontFamily: FontFamily.regular, fontSize: 14, color: Colors.white, lineHeight: 20, textAlign: 'center' },
  closeButton: { position: 'absolute', top: 52, right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  closeButtonPressed: { backgroundColor: 'rgba(255,255,255,0.4)' },
  closeIcon: { fontSize: 14, color: Colors.white, fontFamily: FontFamily.bold },
  downloadContainer: { position: 'absolute', bottom: 40, left: 16, right: 16, zIndex: 5 },
  downloadButton: { backgroundColor: Colors.rlpYellow, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  downloadButtonPressed: { opacity: 0.85 },
  downloadText: { fontFamily: FontFamily.semiBold, fontSize: 16, color: Colors.onSurface },
});
