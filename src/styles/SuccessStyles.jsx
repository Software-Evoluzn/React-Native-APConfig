import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  success: {
    fontSize: 60,
    color: 'green',
  },

  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },

  subtitle: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },

  button: {
    marginTop: 30,
    backgroundColor: '#185FA5',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});