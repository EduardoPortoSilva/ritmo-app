import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  TextInput,
  type ScrollViewProps,
  type TextInputProps,
} from 'react-native';
import { keyboardScrollOffset } from './keyboardGeometry';

type InputContext = {
  viewportHeight: number;
  focus: (input: TextInput) => void;
  blur: (input: TextInput) => void;
  reveal: () => void;
};
const InputScroll = createContext<InputContext | null>(null);
function assignRef<T>(ref: React.ForwardedRef<T>, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) ref.current = value;
}

// Forward the native instance so existing scrollTo/scrollToEnd callers keep working.
export type KeyboardScrollView = ScrollView;
export const KeyboardScrollView = forwardRef<ScrollView, ScrollViewProps>(
  function KeyboardScrollView(
    {
      children,
      contentContainerStyle,
      onLayout,
      onScroll,
      onContentSizeChange,
      horizontal,
      ...props
    },
    forwardedRef,
  ) {
    const scroll = useRef<ScrollView | null>(null);
    const input = useRef<TextInput | null>(null);
    const offset = useRef(0);
    const keyboardTop = useRef<number | undefined>(Keyboard.metrics?.()?.screenY);
    const frame = useRef<number | null>(null);
    const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [focused, setFocused] = useState(false);
    const [viewportHeight, setViewportHeight] = useState(0);
    const reveal = useCallback(() => {
      const target = input.current;
      const viewport = scroll.current;
      if (!target || !viewport || !target.isFocused() || horizontal) return;
      viewport.getNativeScrollRef()?.measureInWindow((_x, viewportTop, _width, viewportHeight) => {
        target.measureInWindow((_inputX, inputTop, _inputWidth, inputHeight) => {
          if (input.current !== target || scroll.current !== viewport || !target.isFocused())
            return;
          const next = keyboardScrollOffset({
            offset: offset.current,
            viewportTop,
            viewportHeight,
            inputTop,
            inputHeight,
            keyboardTop: keyboardTop.current,
          });
          if (Math.abs(next - offset.current) > 1) {
            viewport.scrollTo({ y: next, animated: true });
          }
        });
      });
    }, [horizontal]);
    const schedule = useCallback(() => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      if (settle.current !== null) clearTimeout(settle.current);
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        reveal();
      });
      // Recheck once after the keyboard/modal animation and the resulting layout settle.
      settle.current = setTimeout(() => {
        settle.current = null;
        reveal();
      }, 250);
    }, [reveal]);
    useEffect(() => {
      const show = Keyboard.addListener('keyboardDidShow', (event) => {
        keyboardTop.current = event.endCoordinates.screenY;
        schedule();
      });
      const hide = Keyboard.addListener('keyboardDidHide', () => {
        keyboardTop.current = undefined;
        setFocused(false);
      });
      return () => {
        show.remove();
        hide.remove();
        if (frame.current !== null) cancelAnimationFrame(frame.current);
        if (settle.current !== null) clearTimeout(settle.current);
      };
    }, [schedule]);
    const context = useMemo<InputContext>(
      () => ({
        viewportHeight,
        focus: (target) => {
          input.current = target;
          setFocused(true);
          schedule();
        },
        blur: (target) => {
          if (input.current === target) {
            input.current = null;
            // Keep the space until didHide: a Save press must not move its button on blur.
          }
        },
        reveal: schedule,
      }),
      [schedule, viewportHeight],
    );
    const padding = StyleSheet.flatten(contentContainerStyle);
    const bottom = padding?.paddingBottom ?? padding?.paddingVertical ?? padding?.padding ?? 0;
    return (
      <InputScroll.Provider value={context}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          {...props}
          horizontal={horizontal}
          ref={(value) => {
            scroll.current = value;
            assignRef(forwardedRef, value);
          }}
          contentContainerStyle={[
            contentContainerStyle,
            focused &&
              !horizontal && { paddingBottom: (typeof bottom === 'number' ? bottom : 0) + 32 },
          ]}
          onLayout={(event) => {
            setViewportHeight(event.nativeEvent.layout.height);
            onLayout?.(event);
            schedule();
          }}
          onContentSizeChange={(width, height) => {
            onContentSizeChange?.(width, height);
            if (input.current) schedule();
          }}
          scrollEventThrottle={props.scrollEventThrottle ?? 16}
          onScrollBeginDrag={(event) => {
            if (frame.current !== null) cancelAnimationFrame(frame.current);
            if (settle.current !== null) clearTimeout(settle.current);
            frame.current = null;
            settle.current = null;
            props.onScrollBeginDrag?.(event);
          }}
          onScroll={(event) => {
            offset.current = event.nativeEvent.contentOffset.y;
            onScroll?.(event);
          }}
        >
          {children}
        </ScrollView>
      </InputScroll.Provider>
    );
  },
);

export type KeyboardTextInput = TextInput;
export const KeyboardTextInput = forwardRef<TextInput, TextInputProps>(function KeyboardTextInput(
  { onFocus, onBlur, onContentSizeChange, ...props },
  forwardedRef,
) {
  const context = useContext(InputScroll);
  const input = useRef<TextInput | null>(null);
  const inputStyle = StyleSheet.flatten(props.style);
  const available = Math.max(48, (context?.viewportHeight ?? 0) - 52);
  const maxHeight =
    typeof inputStyle?.maxHeight === 'number'
      ? Math.min(inputStyle.maxHeight, available)
      : available;
  const minHeight = typeof inputStyle?.minHeight === 'number' ? inputStyle.minHeight : 0;
  return (
    <TextInput
      {...props}
      style={[
        props.style,
        props.multiline &&
          !!context?.viewportHeight && {
            maxHeight,
            minHeight: Math.min(minHeight, maxHeight),
          },
      ]}
      ref={(value) => {
        input.current = value;
        assignRef(forwardedRef, value);
      }}
      onFocus={(event) => {
        if (input.current) context?.focus(input.current);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        if (input.current) context?.blur(input.current);
        onBlur?.(event);
      }}
      onContentSizeChange={(event) => {
        onContentSizeChange?.(event);
        if (input.current?.isFocused()) context?.reveal();
      }}
    />
  );
});
