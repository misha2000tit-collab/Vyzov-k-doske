
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  StyleSheet, Animated, Easing, Alert, StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = ['#8d5cf6','#ed79bc','#4a9fe8','#40c8b2','#f0b54d','#ef795d','#6e78ee','#b878e8'];

export default function App() {
  const [names, setNames] = useState([]);
  const [original, setOriginal] = useState([]);
  const [input, setInput] = useState('');
  const [winner, setWinner] = useState('Готовы к выбору?');
  const [spinning, setSpinning] = useState(false);
  const [angle, setAngle] = useState(0);
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      try {
        const savedNames = await AsyncStorage.getItem('board_remaining');
        const savedOriginal = await AsyncStorage.getItem('board_original');
        if (savedNames) setNames(JSON.parse(savedNames));
        if (savedOriginal) {
          const parsed = JSON.parse(savedOriginal);
          setOriginal(parsed);
          setInput(parsed.join('\n'));
        }
      } catch (e) {}
    })();
  }, []);

  async function saveData(nextNames, nextOriginal) {
    try {
      await AsyncStorage.setItem('board_remaining', JSON.stringify(nextNames));
      await AsyncStorage.setItem('board_original', JSON.stringify(nextOriginal));
    } catch (e) {}
  }

  function saveList() {
    if (spinning) return;
    const list = [...new Set(input.split(/[\n,]+/).map(x => x.trim()).filter(Boolean))];
    setNames(list);
    setOriginal(list);
    setWinner('Список обновлён');
    saveData(list, list);
  }

  function resetRound() {
    if (spinning) return;
    setNames([...original]);
    setWinner('Раунд начат заново');
    saveData(original, original);
  }

  function clearList() {
    if (spinning) return;
    setNames([]);
    setOriginal([]);
    setInput('');
    setWinner('Список пуст');
    saveData([], []);
  }

  function spin() {
    if (spinning || names.length === 0) return;
    setSpinning(true);
    const index = Math.floor(Math.random() * names.length);
    const chosen = names[index];
    const target = angle + 1800 + Math.random() * 900;
    setAngle(target);

    Animated.timing(rotation, {
      toValue: target,
      duration: 4200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start(() => {
      setWinner(chosen);
      const remaining = names.filter((_, i) => i !== index);
      setNames(remaining);
      saveData(remaining, original);
      setSpinning(false);
    });
  }

  const rotate = rotation.interpolate({
    inputRange: [0, 3600],
    outputRange: ['0deg', '3600deg'],
    extrapolate: 'extend'
  });

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#100d22" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>CLASSROOM RANDOMIZER</Text>
        <Text style={styles.title}>Вызов к доске</Text>
        <Text style={styles.subtitle}>Кто сегодня отвечает? Решит рулетка.</Text>

        <View style={styles.panel}>
          <Text style={styles.pointer}>▼</Text>
          <Animated.View style={[styles.wheel, { transform: [{ rotate }] }]}>
            {names.length === 0 ? (
              <View style={styles.emptyWheel}>
                <Text style={styles.emptyText}>Добавь учеников</Text>
              </View>
            ) : (
              names.map((name, i) => (
                <View key={name + i} style={[
                  styles.wheelItem,
                  { backgroundColor: COLORS[i % COLORS.length],
                    transform: [{ rotate: `${i * (360 / names.length)}deg` }] }
                ]}>
                  <Text numberOfLines={1} style={styles.wheelName}>{name}</Text>
                </View>
              ))
            )}
            <View style={styles.hub}><Text style={styles.star}>★</Text></View>
          </Animated.View>

          <Pressable style={[styles.button, spinning && styles.disabled]} onPress={spin} disabled={spinning || names.length === 0}>
            <Text style={styles.buttonText}>{spinning ? 'Рулетка вращается…' : '🎲 Крутить рулетку'}</Text>
          </Pressable>

          <View style={styles.result}>
            <Text style={styles.resultLabel}>СЛЕДУЮЩИЙ ОТВЕЧАЕТ</Text>
            <Text style={styles.winner}>{winner}</Text>
          </View>
          <Text style={styles.count}>Осталось: {names.length} · Всего: {original.length}</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.heading}>✏️ Список учеников</Text>
          <Text style={styles.help}>Каждое имя — с новой строки</Text>
          <TextInput
            value={input}
            onChangeText={setInput}
            multiline
            placeholder={'Аня\nМиша\nСаша'}
            placeholderTextColor="#77718d"
            style={styles.input}
          />
          <Pressable style={styles.button} onPress={saveList}>
            <Text style={styles.buttonText}>Сохранить список</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={() => setInput('Аня\nМиша\nСаша\nДаша\nАртём\nКатя\nИлья\nСофия')}>
            <Text style={styles.buttonText}>Вставить пример</Text>
          </Pressable>
          <Text style={styles.help}>Выбранный ученик автоматически удаляется до сброса раунда. Список сохраняется на устройстве.</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.heading}>🔄 Управление раундом</Text>
          <Pressable style={styles.secondary} onPress={resetRound}>
            <Text style={styles.buttonText}>Вернуть всех</Text>
          </Pressable>
          <Pressable style={styles.danger} onPress={clearList}>
            <Text style={styles.buttonText}>Очистить список</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b0a14' },
  content: { padding: 16, paddingBottom: 36 },
  eyebrow: { textAlign: 'center', color: '#c9b4ff', fontSize: 11, letterSpacing: 3, marginTop: 10 },
  title: { color: '#fff', textAlign: 'center', fontSize: 31, fontWeight: '900', marginTop: 6 },
  subtitle: { color: '#b8b1d2', textAlign: 'center', marginBottom: 16, marginTop: 5 },
  panel: { backgroundColor: '#171329', borderColor: '#ffffff20', borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 14 },
  pointer: { color: '#fff1a8', textAlign: 'center', fontSize: 25, zIndex: 2 },
  wheel: { width: 280, height: 280, borderRadius: 140, alignSelf: 'center', backgroundColor: '#29223e', borderWidth: 5, borderColor: '#ffffff80', marginBottom: 18, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  wheelItem: { position: 'absolute', width: 130, height: 38, left: 140, top: 121, justifyContent: 'center', paddingLeft: 24, borderRadius: 8 },
  wheelName: { color: '#fff', fontSize: 12, fontWeight: '800', width: 96 },
  emptyWheel: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#c8bce9', fontWeight: '700' },
  hub: { position: 'absolute', width: 58, height: 58, borderRadius: 29, backgroundColor: '#f3d58c', borderWidth: 5, borderColor: '#fff5d8', alignItems: 'center', justifyContent: 'center' },
  star: { color: '#39234c', fontSize: 24, fontWeight: '900' },
  button: { backgroundColor: '#8758ed', borderRadius: 13, padding: 15, alignItems: 'center', marginTop: 8 },
  secondary: { backgroundColor: '#ffffff18', borderWidth: 1, borderColor: '#ffffff25', borderRadius: 13, padding: 13, alignItems: 'center', marginTop: 9 },
  danger: { backgroundColor: '#7d304f', borderRadius: 13, padding: 13, alignItems: 'center', marginTop: 9 },
  disabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  result: { backgroundColor: '#c3a0ff12', borderColor: '#c3a0ff45', borderWidth: 1, borderRadius: 15, padding: 14, alignItems: 'center', marginTop: 13 },
  resultLabel: { color: '#c9b4ff', fontSize: 10, letterSpacing: 2 },
  winner: { color: '#fff', fontSize: 24, fontWeight: '900', textAlign: 'center', marginTop: 5 },
  count: { color: '#c9b4ff', textAlign: 'center', fontSize: 12, marginTop: 12 },
  heading: { color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 10 },
  help: { color: '#aaa3c4', fontSize: 12, lineHeight: 18, marginTop: 8, marginBottom: 6 },
  input: { minHeight: 125, color: '#fff', backgroundColor: '#100d20', borderColor: '#ffffff30', borderWidth: 1, borderRadius: 12, padding: 12, textAlignVertical: 'top', marginTop: 8, marginBottom: 5 }
});
