
import base64

def create_icon(path_d, color="#fff"):
    # Create SVG with a semi-transparent black circle background
    # ViewBox 0 0 24 24
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.15)" />
  <path d="{path_d}" fill="{color}" transform="scale(0.7) translate(5,5)" />
</svg>'''
    return "data:image/svg+xml;base64," + base64.b64encode(svg.encode('utf-8')).decode('utf-8')

# Paths (simplified from standard icons)
# Play (Triangle)
path_play = "M8 5v14l11-7z"
# Motor (Circle with cog or simple M) - User provided: circle and path
# User's Motor Path: <circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/> (Cross in circle)
# I will use a simple gear or the user's suggestion.
# User's suggestion for motor: <svg ... stroke="white" stroke-width="3"> ... </svg>
# My generator above uses fill. I should adjust for stroke if needed.
# Let's stick to fill for simplicity or adjust the function.

def create_icon_stroke(content, stroke="#fff"):
     svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="{stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.15)" stroke="none" />
  <g transform="scale(0.7) translate(5,5)">
  {content}
  </g>
</svg>'''
     return "data:image/svg+xml;base64," + base64.b64encode(svg.encode('utf-8')).decode('utf-8')

# Motor Content
motor_content = '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/>'

# Wait (Hourglass or Clock)
# Path: M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z (Clock)
wait_content = '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'

# Loop (Repeat)
# Path: M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8
loop_content = '<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>'

# LED (Sun or Bulb)
led_content = '<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>'

# Sound (Speaker)
sound_content = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>'

# Generate
print("ICON_PLAY = '" + create_icon(path_play) + "';")
print("ICON_MOTOR = '" + create_icon_stroke(motor_content) + "';")
print("ICON_WAIT = '" + create_icon_stroke(wait_content) + "';")
print("ICON_LOOP = '" + create_icon_stroke(loop_content) + "';")
print("ICON_LED = '" + create_icon_stroke(led_content) + "';")
print("ICON_SOUND = '" + create_icon_stroke(sound_content) + "';")
